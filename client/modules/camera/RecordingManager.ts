import { RecordingOptions } from './types';

export class RecordingManager {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;
  private startTime: number = 0;
  private maxDuration: number = 0;
  private timeoutId: number | null = null;

  constructor() {}

  // Start recording from media stream
  async startRecording(
    stream: MediaStream,
    options: RecordingOptions = { format: 'webm', quality: 'medium' },
    onDataAvailable?: (chunk: Blob) => void,
    onStop?: (blob: Blob) => void,
    onError?: (error: Error) => void
  ): Promise<boolean> {
    try {
      if (this.isRecording) {
        await this.stopRecording();
      }

      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported(`video/${options.format}`)) {
        throw new Error(`Format ${options.format} not supported`);
      }

      // Configure MediaRecorder options
      const mimeType = `video/${options.format}`;
      const videoBitsPerSecond = this.getVideoBitrate(options.quality);
      
      const mediaRecorderOptions: MediaRecorderOptions = {
        mimeType,
        videoBitsPerSecond
      };

      this.mediaRecorder = new MediaRecorder(stream, mediaRecorderOptions);
      this.recordedChunks = [];
      this.startTime = Date.now();
      this.maxDuration = options.maxDuration || 0;

      // Set up event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
          if (onDataAvailable) {
            onDataAvailable(event.data);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: mimeType });
        if (onStop) {
          onStop(blob);
        }
        this.cleanup();
      };

      this.mediaRecorder.onerror = (event) => {
        const error = new Error(`Recording error: ${event}`);
        if (onError) {
          onError(error);
        }
        this.cleanup();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;

      // Set up auto-stop if max duration is specified
      if (this.maxDuration > 0) {
        this.timeoutId = window.setTimeout(() => {
          this.stopRecording();
        }, this.maxDuration * 1000);
      }

      return true;

    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error('Unknown recording error'));
      }
      return false;
    }
  }

  // Stop recording
  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.isRecording || !this.mediaRecorder) {
        resolve(null);
        return;
      }

      // Set up one-time stop handler
      const handleStop = () => {
        const blob = new Blob(this.recordedChunks, { 
          type: this.mediaRecorder?.mimeType || 'video/webm' 
        });
        resolve(blob);
      };

      this.mediaRecorder.addEventListener('stop', handleStop, { once: true });
      this.mediaRecorder.stop();
    });
  }

  // Pause recording
  pauseRecording(): boolean {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      return true;
    }
    return false;
  }

  // Resume recording
  resumeRecording(): boolean {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      return true;
    }
    return false;
  }

  // Get recording duration in seconds
  getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  // Get recording state
  getRecordingState(): string {
    return this.mediaRecorder?.state || 'inactive';
  }

  // Convert blob to data URL
  async blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // Download recorded video
  async downloadRecording(blob: Blob, filename?: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `rooster-scan-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Upload recording to server
  async uploadRecording(
    blob: Blob, 
    uploadUrl: string, 
    onProgress?: (progress: number) => void
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('video', blob, `recording-${Date.now()}.webm`);

      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.response, { status: xhr.status }));
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  }

  // Get video bitrate based on quality setting
  private getVideoBitrate(quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'low':
        return 500000; // 500 kbps
      case 'medium':
        return 1500000; // 1.5 Mbps
      case 'high':
        return 4000000; // 4 Mbps
      default:
        return 1500000;
    }
  }

  // Cleanup resources
  private cleanup(): void {
    this.isRecording = false;
    
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  // Check if recording is supported
  static isSupported(): boolean {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('video/webm');
  }

  // Get supported formats
  static getSupportedFormats(): string[] {
    const formats = ['webm', 'mp4'];
    return formats.filter(format => MediaRecorder.isTypeSupported(`video/${format}`));
  }

  // Getters
  get recording(): boolean {
    return this.isRecording;
  }

  get chunks(): Blob[] {
    return [...this.recordedChunks];
  }

  // Dispose
  dispose(): void {
    if (this.isRecording) {
      this.stopRecording();
    }
    this.cleanup();
    this.mediaRecorder = null;
    this.recordedChunks = [];
  }
}
