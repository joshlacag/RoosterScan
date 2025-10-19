/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */


// Rooster types
export interface Rooster {
  id: string;
  name: string;
  breed?: string;
  ageMonths?: number;
  weightGrams?: number;
  color?: string;
  gender?: string;
  registrationNumber?: string;
  bloodline?: string;
  birthDate?: string;
  acquisitionDate?: string;
  status?: string;
  notes?: string;
  avatarImageUrl?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoosterRequest {
  name: string;
  breed?: string;
  ageMonths?: number;
  weightGrams?: number;
  color?: string;
  gender?: string;
  registrationNumber?: string;
  bloodline?: string;
  birthDate?: string;
  acquisitionDate?: string;
  status?: string;
  notes?: string;
  avatarImageUrl?: string;
}

export interface UpdateRoosterRequest {
  name?: string;
  breed?: string;
  ageMonths?: number;
  weightGrams?: number;
  color?: string;
  gender?: string;
  registrationNumber?: string;
  bloodline?: string;
  birthDate?: string;
  acquisitionDate?: string;
  status?: string;
  notes?: string;
  avatarImageUrl?: string;
}

// Scan types
export interface ScanResults {
  posture: string;
  wing: string;
  legs: string;
  movement: string;
  
  // Enhanced AI analysis data (optional for backward compatibility)
  pose_confidence?: number;
  keypoints_detected?: number;
  analysis_type?: string;
  health_assessment?: string;
  
  // Additional metadata
  [key: string]: any; // Allow for flexible additional properties
}

export interface Scan {
  id: string;
  roosterId: string | null;
  userId: string;
  sessionName?: string;
  scanType: 'live_video' | 'recorded_video' | 'image_sequence';
  duration?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  status: 'processing' | 'completed' | 'failed' | 'archived';
  poseData?: any;
  injuryDetections?: any[];
  analysisConfidence?: number;
  fps?: number;
  resolution?: string;
  cameraSettings?: any;
  processingTimeMs?: number;
  modelVersion?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Legacy fields for backward compatibility
  results?: ScanResults;
  overlay?: boolean;
  injuries?: string[];
  severity?: "low" | "medium" | "high";
}

// CreateScanRequest moved to avoid duplicates

// Report types (matching database schema)
export interface HealthReport {
  id: string;
  scanId: string;
  roosterId: string;
  userId: string;
  title: string;
  summary?: string;
  detailedAnalysis?: string;
  recommendations?: string;
  overallHealthScore?: number;
  mobilityScore?: number;
  postureScore?: number;
  totalInjuriesDetected: number;
  highPriorityInjuries: number;
  reportType: 'automated' | 'manual' | 'hybrid';
  status: 'draft' | 'final' | 'archived';
  pdfUrl?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequest {
  scanId: string;
  title: string;
  roosterId?: string;
  summary?: string;
  detailedAnalysis?: string;
  recommendations?: string;
  overallHealthScore?: number;
  mobilityScore?: number;
  postureScore?: number;
  reportType?: 'automated' | 'manual' | 'hybrid';
  startDate?: string;
  endDate?: string;
}

// Educational Content Types
export interface EducationalContent {
  id: string;
  title: string;
  description: string;
  content_type: 'article' | 'video' | 'interactive_3d' | 'quiz';
  category: 'anatomy' | 'injury_prevention' | 'treatment' | 'breeding' | 'general';
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  content_url?: string;
  thumbnail_url?: string;
  duration_minutes?: number;
  tags: string[];
  is_featured: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  content_id: string;
  progress_percentage: number;
  completed: boolean;
  time_spent_minutes: number;
  last_accessed: string;
  educational_content?: EducationalContent;
}

export interface EducationFilters {
  category?: string;
  difficulty?: string;
  type?: string;
  featured?: boolean;
  search?: string;
}

// API Response types
export interface ApiError {
  error: string;
  success: false;
}

export interface ApiResponse<T> {
  data: T;
  success: true;
}

// Request types (using existing Rooster interface structure)
export interface UpdateRoosterRequest extends Partial<CreateRoosterRequest> {}

export interface CreateScanRequest {
  roosterId?: string;
  results: ScanResults;
  overlay: boolean;
  injuries?: string[];
  severity?: "low" | "medium" | "high";
  notes?: string;
  duration?: number;
}

// Auth types
export interface User {
  email: string;
}

export interface AuthResponse {
  user: User | null;
}
