import { 
  CameraConfig, 
  StreamState, 
  CameraDevice, 
  CameraCapabilities,
  CameraEvent,
  CameraEventType 
} from './types';

export class CameraManager {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private animationFrame: number | null = null;
  private eventListeners: Map<CameraEventType, Function[]> = new Map();
  
  private state: StreamState = {
    isActive: false,
    isRecording: false,
    currentFps: 0,
    resolution: '',
    deviceId: '',
  };

  constructor(
    private config: CameraConfig = {
      width: 1280,
      height: 720,
      fps: 30,
      facingMode: 'environment'
    }
  ) {
    this.initializeCanvas();
  }

  private initializeCanvas(): void {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.config.width;
    this.canvas.height = this.config.height;
    this.context = this.canvas.getContext('2d');
  }

  // Get available camera devices
  async getAvailableDevices(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter(device => device.kind === 'videoinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
          kind: 'videoinput' as const
        }));
    } catch (error) {
      this.emitEvent('error', { message: 'Failed to enumerate devices', error });
      return [];
    }
  }

  // Get camera capabilities
  async getCameraCapabilities(deviceId?: string): Promise<CameraCapabilities | null> {
    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId } : true
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities();
      
      // Clean up temporary stream
      track.stop();
      
      return {
        width: capabilities.width ? { min: capabilities.width.min || 320, max: capabilities.width.max || 1920 } : { min: 320, max: 1920 },
        height: capabilities.height ? { min: capabilities.height.min || 240, max: capabilities.height.max || 1080 } : { min: 240, max: 1080 },
        frameRate: capabilities.frameRate ? { min: capabilities.frameRate.min || 15, max: capabilities.frameRate.max || 60 } : { min: 15, max: 60 },
        facingMode: capabilities.facingMode || ['user', 'environment']
      };
    } catch (error) {
      this.emitEvent('error', { message: 'Failed to get capabilities', error });
      return null;
    }
  }

  // Start camera stream
  async startStream(videoElement: HTMLVideoElement, deviceId?: string): Promise<boolean> {
    try {
      if (this.state.isActive) {
        await this.stopStream();
      }

      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: this.config.width },
          height: { ideal: this.config.height },
          frameRate: { ideal: this.config.fps },
          facingMode: this.config.facingMode,
          ...(deviceId && { deviceId })
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement = videoElement;
      
      videoElement.srcObject = this.stream;
      videoElement.play();

      // Update state
      const track = this.stream.getVideoTracks()[0];
      const settings = track.getSettings();
      
      this.state = {
        isActive: true,
        isRecording: false,
        currentFps: settings.frameRate || this.config.fps,
        resolution: `${settings.width}x${settings.height}`,
        deviceId: settings.deviceId || '',
      };

      this.emitEvent('stream-started', this.state);
      return true;

    } catch (error) {
      this.state.error = error instanceof Error ? error.message : 'Unknown error';
      this.emitEvent('error', { message: 'Failed to start stream', error });
      return false;
    }
  }

  // Stop camera stream
  async stopStream(): Promise<void> {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }

    this.state.isActive = false;
    this.state.isRecording = false;
    this.emitEvent('stream-stopped');
  }

  // Capture current frame as ImageData
  captureFrame(): ImageData | null {
    if (!this.videoElement || !this.context || !this.state.isActive) {
      return null;
    }

    try {
      // Draw video frame to canvas
      this.context.drawImage(
        this.videoElement,
        0, 0,
        this.config.width,
        this.config.height
      );

      // Get image data
      const imageData = this.context.getImageData(
        0, 0,
        this.config.width,
        this.config.height
      );

      this.emitEvent('frame-captured', { imageData, timestamp: Date.now() });
      return imageData;

    } catch (error) {
      this.emitEvent('error', { message: 'Failed to capture frame', error });
      return null;
    }
  }

  // Switch camera device
  async switchCamera(deviceId: string): Promise<boolean> {
    if (!this.videoElement) {
      return false;
    }

    const wasActive = this.state.isActive;
    if (wasActive) {
      await this.stopStream();
      const success = await this.startStream(this.videoElement, deviceId);
      if (success) {
        this.emitEvent('device-changed', { deviceId });
      }
      return success;
    }
    
    return false;
  }

  // Update camera configuration
  updateConfig(newConfig: Partial<CameraConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.canvas) {
      this.canvas.width = this.config.width;
      this.canvas.height = this.config.height;
    }
  }

  // Event system
  addEventListener(event: CameraEventType, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  removeEventListener(event: CameraEventType, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitEvent(type: CameraEventType, data?: any): void {
    const event: CameraEvent = {
      type,
      data,
      timestamp: Date.now()
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => callback(event));
    }
  }

  // Getters
  get isActive(): boolean {
    return this.state.isActive;
  }

  get currentState(): StreamState {
    return { ...this.state };
  }

  get currentStream(): MediaStream | null {
    return this.stream;
  }

  get canvasElement(): HTMLCanvasElement | null {
    return this.canvas;
  }

  // Cleanup
  dispose(): void {
    this.stopStream();
    this.eventListeners.clear();
    
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.context = null;
    }
  }
}
