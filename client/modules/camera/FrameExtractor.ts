import { VideoFrame, FrameProcessorConfig } from './types';

export class FrameExtractor {
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private animationFrame: number | null = null;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;
  private actualFps: number = 0;
  private isProcessing: boolean = false;

  constructor(
    private config: FrameProcessorConfig = {
      targetFps: 30,
      skipFrames: 0,
      processEveryNthFrame: 1
    }
  ) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  // Start extracting frames from video element
  startExtraction(
    videoElement: HTMLVideoElement,
    onFrame: (frame: VideoFrame) => void,
    onFpsUpdate?: (fps: number) => void
  ): void {
    if (this.isProcessing) {
      this.stopExtraction();
    }

    this.isProcessing = true;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();

    // Set canvas size to match video
    this.canvas.width = videoElement.videoWidth || 640;
    this.canvas.height = videoElement.videoHeight || 480;

    const processFrame = (currentTime: number) => {
      if (!this.isProcessing) return;

      // Calculate actual FPS
      const deltaTime = currentTime - this.lastFrameTime;
      if (deltaTime >= 1000) { // Update FPS every second
        this.actualFps = (this.frameCount * 1000) / deltaTime;
        if (onFpsUpdate) {
          onFpsUpdate(this.actualFps);
        }
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }

      // Check if we should process this frame
      const shouldProcess = this.frameCount % this.config.processEveryNthFrame === 0;
      
      if (shouldProcess && videoElement.readyState >= 2) {
        try {
          // Draw video frame to canvas
          this.context.drawImage(
            videoElement,
            0, 0,
            this.canvas.width,
            this.canvas.height
          );

          // Extract image data
          const imageData = this.context.getImageData(
            0, 0,
            this.canvas.width,
            this.canvas.height
          );

          // Create frame object
          const frame: VideoFrame = {
            imageData,
            timestamp: currentTime,
            frameNumber: this.frameCount,
            canvas: this.canvas
          };

          // Call frame callback
          onFrame(frame);

        } catch (error) {
          console.error('Frame extraction error:', error);
        }
      }

      this.frameCount++;

      // Schedule next frame based on target FPS
      const targetInterval = 1000 / this.config.targetFps;
      const nextFrameDelay = Math.max(0, targetInterval - (performance.now() - currentTime));
      
      setTimeout(() => {
        this.animationFrame = requestAnimationFrame(processFrame);
      }, nextFrameDelay);
    };

    this.animationFrame = requestAnimationFrame(processFrame);
  }

  // Stop frame extraction
  stopExtraction(): void {
    this.isProcessing = false;
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // Extract single frame
  extractSingleFrame(videoElement: HTMLVideoElement): VideoFrame | null {
    if (videoElement.readyState < 2) {
      return null;
    }

    try {
      // Set canvas size
      this.canvas.width = videoElement.videoWidth || 640;
      this.canvas.height = videoElement.videoHeight || 480;

      // Draw frame
      this.context.drawImage(
        videoElement,
        0, 0,
        this.canvas.width,
        this.canvas.height
      );

      // Get image data
      const imageData = this.context.getImageData(
        0, 0,
        this.canvas.width,
        this.canvas.height
      );

      return {
        imageData,
        timestamp: performance.now(),
        frameNumber: this.frameCount++,
        canvas: this.canvas
      };

    } catch (error) {
      console.error('Single frame extraction error:', error);
      return null;
    }
  }

  // Convert frame to blob for saving
  async frameToBlob(frame: VideoFrame, format: 'png' | 'jpeg' = 'jpeg', quality = 0.8): Promise<Blob | null> {
    return new Promise((resolve) => {
      frame.canvas.toBlob(resolve, `image/${format}`, quality);
    });
  }

  // Convert frame to data URL
  frameToDataURL(frame: VideoFrame, format: 'png' | 'jpeg' = 'jpeg', quality = 0.8): string {
    return frame.canvas.toDataURL(`image/${format}`, quality);
  }

  // Resize frame
  resizeFrame(frame: VideoFrame, width: number, height: number): VideoFrame {
    const resizedCanvas = document.createElement('canvas');
    const resizedContext = resizedCanvas.getContext('2d')!;
    
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    
    // Draw original frame scaled to new size
    resizedContext.drawImage(
      frame.canvas,
      0, 0,
      frame.canvas.width,
      frame.canvas.height,
      0, 0,
      width,
      height
    );

    // Get resized image data
    const resizedImageData = resizedContext.getImageData(0, 0, width, height);

    return {
      imageData: resizedImageData,
      timestamp: frame.timestamp,
      frameNumber: frame.frameNumber,
      canvas: resizedCanvas
    };
  }

  // Apply preprocessing to frame
  preprocessFrame(frame: VideoFrame, options: {
    grayscale?: boolean;
    normalize?: boolean;
    brightness?: number;
    contrast?: number;
  } = {}): VideoFrame {
    const processedCanvas = document.createElement('canvas');
    const processedContext = processedCanvas.getContext('2d')!;
    
    processedCanvas.width = frame.canvas.width;
    processedCanvas.height = frame.canvas.height;
    
    // Copy original frame
    processedContext.drawImage(frame.canvas, 0, 0);
    
    if (options.grayscale || options.normalize || options.brightness || options.contrast) {
      const imageData = processedContext.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i + 1];
        let b = data[i + 2];
        
        // Apply brightness
        if (options.brightness !== undefined) {
          const brightness = options.brightness;
          r = Math.max(0, Math.min(255, r + brightness));
          g = Math.max(0, Math.min(255, g + brightness));
          b = Math.max(0, Math.min(255, b + brightness));
        }
        
        // Apply contrast
        if (options.contrast !== undefined) {
          const contrast = options.contrast;
          r = Math.max(0, Math.min(255, (r - 128) * contrast + 128));
          g = Math.max(0, Math.min(255, (g - 128) * contrast + 128));
          b = Math.max(0, Math.min(255, (b - 128) * contrast + 128));
        }
        
        // Convert to grayscale
        if (options.grayscale) {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          r = g = b = gray;
        }
        
        // Normalize (0-1 range, then back to 0-255)
        if (options.normalize) {
          r = (r / 255) * 255;
          g = (g / 255) * 255;
          b = (b / 255) * 255;
        }
        
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
      }
      
      processedContext.putImageData(imageData, 0, 0);
    }
    
    return {
      imageData: processedContext.getImageData(0, 0, processedCanvas.width, processedCanvas.height),
      timestamp: frame.timestamp,
      frameNumber: frame.frameNumber,
      canvas: processedCanvas
    };
  }

  // Update configuration
  updateConfig(newConfig: Partial<FrameProcessorConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current FPS
  getCurrentFps(): number {
    return this.actualFps;
  }

  // Get processing status
  get isExtracting(): boolean {
    return this.isProcessing;
  }

  // Cleanup
  dispose(): void {
    this.stopExtraction();
    this.canvas.remove();
  }
}
