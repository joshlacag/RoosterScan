-- RoosterScan Database Schema
-- Augmented Reality Assisted X-Ray Analysis for Rooster Injuries

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (handled by Supabase Auth)
-- auth.users is automatically created by Supabase

-- User profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('breeder', 'veterinarian', 'researcher')) DEFAULT 'breeder',
    organization TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roosters/Gamefowl table
CREATE TABLE roosters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    breed TEXT,
    age_months INTEGER,
    weight_grams INTEGER,
    color TEXT,
    gender TEXT CHECK (gender IN ('male', 'female')) DEFAULT 'male',
    registration_number TEXT,
    bloodline TEXT,
    birth_date DATE,
    acquisition_date DATE,
    status TEXT CHECK (status IN ('active', 'retired', 'deceased')) DEFAULT 'active',
    notes TEXT,
    avatar_image_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anatomical models table (3D models for AR overlay)
CREATE TABLE anatomical_models (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    model_type TEXT CHECK (model_type IN ('skeleton', 'muscle', 'organ', 'full_body')),
    file_url TEXT NOT NULL, -- 3D model file (GLB/GLTF)
    thumbnail_url TEXT,
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injury types and classifications
CREATE TABLE injury_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    category TEXT CHECK (category IN ('wing', 'leg', 'spine', 'muscle', 'gait', 'other')),
    severity_levels TEXT[] DEFAULT ARRAY['mild', 'moderate', 'severe'],
    description TEXT,
    symptoms TEXT[],
    treatment_recommendations TEXT,
    anatomical_region TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scans table (individual scanning sessions)
CREATE TABLE scans (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rooster_id UUID REFERENCES roosters(id) ON DELETE CASCADE,
    session_name TEXT,
    scan_type TEXT CHECK (scan_type IN ('live_video', 'recorded_video', 'image_sequence')) DEFAULT 'live_video',
    duration_seconds INTEGER,
    video_url TEXT,
    thumbnail_url TEXT,
    status TEXT CHECK (status IN ('processing', 'completed', 'failed', 'archived')) DEFAULT 'processing',
    
    -- AI Analysis Results
    pose_data JSONB, -- Pose estimation keypoints and confidence scores
    injury_detections JSONB, -- Array of detected injuries with confidence
    analysis_confidence REAL CHECK (analysis_confidence >= 0 AND analysis_confidence <= 1),
    
    -- Technical metadata
    fps INTEGER DEFAULT 30,
    resolution TEXT, -- e.g., "1920x1080"
    camera_settings JSONB,
    processing_time_ms INTEGER,
    model_version TEXT,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Detected injuries table
CREATE TABLE detected_injuries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    injury_type_id UUID REFERENCES injury_types(id),
    
    -- Detection details
    confidence REAL CHECK (confidence >= 0 AND confidence <= 1) NOT NULL,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
    anatomical_location TEXT,
    
    -- Spatial data (bounding boxes, keypoints)
    bounding_box JSONB, -- {x, y, width, height, confidence}
    keypoints JSONB, -- Array of pose keypoints related to injury
    
    -- Temporal data (for video analysis)
    start_frame INTEGER,
    end_frame INTEGER,
    duration_frames INTEGER,
    
    -- Validation
    is_validated BOOLEAN DEFAULT FALSE,
    validated_by UUID REFERENCES auth.users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    validation_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health reports table
CREATE TABLE health_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
    rooster_id UUID REFERENCES roosters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Report content
    title TEXT NOT NULL,
    summary TEXT,
    detailed_analysis TEXT,
    recommendations TEXT,
    
    -- Overall health metrics
    overall_health_score REAL CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
    mobility_score REAL CHECK (mobility_score >= 0 AND mobility_score <= 100),
    posture_score REAL CHECK (posture_score >= 0 AND posture_score <= 100),
    
    -- Injury summary
    total_injuries_detected INTEGER DEFAULT 0,
    high_priority_injuries INTEGER DEFAULT 0,
    
    -- Report metadata
    report_type TEXT CHECK (report_type IN ('automated', 'manual', 'hybrid')) DEFAULT 'automated',
    status TEXT CHECK (status IN ('draft', 'final', 'archived')) DEFAULT 'draft',
    
    -- File attachments
    pdf_url TEXT,
    images JSONB, -- Array of image URLs
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress tracking table
CREATE TABLE health_progress (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rooster_id UUID REFERENCES roosters(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Progress metrics
    measurement_date DATE NOT NULL,
    overall_health_score REAL,
    mobility_score REAL,
    weight_grams INTEGER,
    
    -- Injury tracking
    active_injuries INTEGER DEFAULT 0,
    resolved_injuries INTEGER DEFAULT 0,
    new_injuries INTEGER DEFAULT 0,
    
    -- Notes and observations
    notes TEXT,
    treatment_applied TEXT,
    
    -- Reference to related scan
    scan_id UUID REFERENCES scans(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Educational content table
CREATE TABLE educational_content (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN ('article', 'video', 'interactive_3d', 'quiz')),
    category TEXT CHECK (category IN ('anatomy', 'injury_prevention', 'treatment', 'breeding', 'nutrition')),
    
    -- Content data
    content_text TEXT,
    media_urls JSONB, -- Array of image/video URLs
    interactive_model_id UUID REFERENCES anatomical_models(id),
    
    -- Metadata
    difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_read_time INTEGER, -- minutes
    tags TEXT[],
    
    -- Publishing
    is_published BOOLEAN DEFAULT FALSE,
    author_id UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User activity and engagement
CREATE TABLE user_activity (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type TEXT CHECK (activity_type IN ('scan', 'report_view', 'education_access', 'rooster_add')),
    entity_id UUID, -- ID of the related entity (scan, report, etc.)
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_roosters_user_id ON roosters(user_id);
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_scans_rooster_id ON scans(rooster_id);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX idx_detected_injuries_scan_id ON detected_injuries(scan_id);
CREATE INDEX idx_detected_injuries_confidence ON detected_injuries(confidence DESC);
CREATE INDEX idx_health_reports_rooster_id ON health_reports(rooster_id);
CREATE INDEX idx_health_progress_rooster_id ON health_progress(rooster_id);
CREATE INDEX idx_health_progress_date ON health_progress(measurement_date DESC);

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE detected_injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own roosters" ON roosters FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own scans" ON scans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own detected injuries" ON detected_injuries FOR SELECT USING (
    EXISTS (SELECT 1 FROM scans WHERE scans.id = detected_injuries.scan_id AND scans.user_id = auth.uid())
);
CREATE POLICY "Users can manage own health reports" ON health_reports FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own health progress" ON health_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own activity" ON user_activity FOR SELECT USING (auth.uid() = user_id);

-- Public read access for educational content and anatomical models
CREATE POLICY "Educational content is publicly readable" ON educational_content FOR SELECT USING (is_published = true);
CREATE POLICY "Anatomical models are publicly readable" ON anatomical_models FOR SELECT USING (is_active = true);
CREATE POLICY "Injury types are publicly readable" ON injury_types FOR SELECT USING (is_active = true);

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roosters_updated_at BEFORE UPDATE ON roosters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scans_updated_at BEFORE UPDATE ON scans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_reports_updated_at BEFORE UPDATE ON health_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_educational_content_updated_at BEFORE UPDATE ON educational_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default injury types
INSERT INTO injury_types (name, category, description, symptoms, anatomical_region) VALUES
('Wing Fracture', 'wing', 'Broken or cracked wing bone', ARRAY['drooping wing', 'inability to fly', 'visible deformity'], 'wing'),
('Leg Fracture', 'leg', 'Broken or cracked leg bone', ARRAY['limping', 'inability to bear weight', 'swelling'], 'leg'),
('Spinal Misalignment', 'spine', 'Vertebral displacement or curvature', ARRAY['abnormal posture', 'difficulty walking', 'head tilt'], 'spine'),
('Muscle Strain', 'muscle', 'Overstretched or torn muscle fibers', ARRAY['stiffness', 'reduced mobility', 'swelling'], 'muscle'),
('Gait Abnormality', 'gait', 'Irregular walking pattern', ARRAY['limping', 'uneven steps', 'balance issues'], 'legs'),
('Joint Inflammation', 'leg', 'Swelling and pain in joints', ARRAY['swelling', 'heat', 'reduced range of motion'], 'joints');

-- Insert default anatomical models (placeholder data)
INSERT INTO anatomical_models (name, description, model_type, file_url, thumbnail_url) VALUES
('Rooster Skeleton', 'Complete skeletal structure of adult rooster', 'skeleton', '/models/rooster_skeleton.glb', '/images/skeleton_thumb.jpg'),
('Wing Anatomy', 'Detailed wing bone and muscle structure', 'muscle', '/models/wing_anatomy.glb', '/images/wing_thumb.jpg'),
('Leg Structure', 'Complete leg and foot anatomy', 'skeleton', '/models/leg_structure.glb', '/images/leg_thumb.jpg'),
('Full Body Model', 'Complete rooster anatomy with all systems', 'full_body', '/models/full_rooster.glb', '/images/full_body_thumb.jpg');
