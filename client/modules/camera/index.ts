// Camera Module Exports
export { CameraManager } from './CameraManager';
export { FrameExtractor } from './FrameExtractor';
export { RecordingManager } from './RecordingManager';
export * from './types';

// Re-export for convenience
export type {
  CameraConfig,
  StreamState,
  VideoFrame,
  RecordingOptions,
  CameraDevice,
  CameraCapabilities,
  FrameProcessorConfig,
  CameraEvent,
  CameraEventType
} from './types';
