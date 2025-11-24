// Camera Module Types
export interface CameraConfig {
  width: number;
  height: number;
  fps: number;
  facingMode: 'user' | 'environment';
  deviceId?: string;
}

export interface StreamState {
  isActive: boolean;
  isRecording: boolean;
  currentFps: number;
  resolution: string;
  deviceId: string;
  error?: string;
}

export interface VideoFrame {
  imageData: ImageData;
  timestamp: number;
  frameNumber: number;
  canvas: HTMLCanvasElement;
}

export interface RecordingOptions {
  format: 'webm' | 'mp4';
  quality: 'low' | 'medium' | 'high';
  maxDuration?: number; // seconds
}

export interface CameraDevice {
  deviceId: string;
  label: string;
  kind: 'videoinput';
}

export interface CameraCapabilities {
  width: { min: number; max: number };
  height: { min: number; max: number };
  frameRate: { min: number; max: number };
  facingMode: string[];
}

export interface FrameProcessorConfig {
  targetFps: number;
  skipFrames: number;
  processEveryNthFrame: number;
}

export type CameraEventType = 
  | 'stream-started'
  | 'stream-stopped'
  | 'recording-started'
  | 'recording-stopped'
  | 'frame-captured'
  | 'error'
  | 'device-changed';

export interface CameraEvent {
  type: CameraEventType;
  data?: any;
  timestamp: number;
}
