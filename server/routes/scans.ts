import { RequestHandler } from "express";
import { CreateScanRequest, Scan, ApiResponse, ApiError } from "@shared/api";
import { supabase, getUserIdFromAuth } from "../lib/supabase";

export const getScans: RequestHandler = async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req.headers.authorization);
    
    const { data: scans, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Map database fields to frontend format
    const mappedScans = (scans || []).map(scan => ({
      id: scan.id,
      roosterId: scan.rooster_id,
      userId: scan.user_id,
      sessionName: scan.session_name,
      scanType: scan.scan_type || 'live_video',
      duration: scan.duration_seconds,
      videoUrl: scan.video_url,
      thumbnailUrl: scan.thumbnail_url,
      status: scan.status || 'completed',
      poseData: scan.pose_data,
      injuryDetections: scan.injury_detections,
      analysisConfidence: scan.analysis_confidence,
      fps: scan.fps,
      resolution: scan.resolution,
      cameraSettings: scan.camera_settings,
      processingTimeMs: scan.processing_time_ms,
      modelVersion: scan.model_version,
      notes: scan.notes,
      createdAt: scan.created_at,
      updatedAt: scan.updated_at,
      // Legacy fields for backward compatibility
      results: scan.pose_data || { posture: "normal", wing: "normal", legs: "normal", movement: "normal" },
      overlay: false,
      injuries: Array.isArray(scan.injury_detections) ? scan.injury_detections.map((inj: any) => inj.type || 'Unknown') : [],
      severity: scan.injury_detections && Array.isArray(scan.injury_detections) && scan.injury_detections.length > 0 
        ? (scan.injury_detections.some((inj: any) => inj.severity === 'severe') ? 'high' as const : 'medium' as const)
        : 'low' as const
    }));

    const response: ApiResponse<Scan[]> = {
      data: mappedScans,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to get scans:', error);
    const apiError: ApiError = { error: "Failed to fetch scans", success: false };
    res.status(500).json(apiError);
  }
};

export const getScanById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserIdFromAuth(req.headers.authorization);
    
    const { data: scan, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        const apiError: ApiError = { error: "Scan not found", success: false };
        return res.status(404).json(apiError);
      }
      throw error;
    }

    // Map database fields to frontend format
    const mappedScan = {
      id: scan.id,
      roosterId: scan.rooster_id,
      userId: scan.user_id,
      sessionName: scan.session_name,
      scanType: scan.scan_type || 'live_video',
      duration: scan.duration_seconds,
      videoUrl: scan.video_url,
      thumbnailUrl: scan.thumbnail_url,
      status: scan.status || 'completed',
      poseData: scan.pose_data,
      injuryDetections: scan.injury_detections,
      analysisConfidence: scan.analysis_confidence,
      fps: scan.fps,
      resolution: scan.resolution,
      cameraSettings: scan.camera_settings,
      processingTimeMs: scan.processing_time_ms,
      modelVersion: scan.model_version,
      notes: scan.notes,
      createdAt: scan.created_at,
      updatedAt: scan.updated_at,
      // Legacy fields for backward compatibility
      results: scan.pose_data || { posture: "normal", wing: "normal", legs: "normal", movement: "normal" },
      overlay: scan.status === 'completed',
      injuries: Array.isArray(scan.injury_detections) ? scan.injury_detections.map((inj: any) => inj.type || 'Unknown') : [],
      severity: (scan.analysis_confidence > 0.8 ? 'high' : scan.analysis_confidence > 0.5 ? 'medium' : 'low') as "low" | "medium" | "high"
    };

    const response: ApiResponse<Scan> = {
      data: mappedScan,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to get scan:', error);
    const apiError: ApiError = { error: "Failed to get scan", success: false };
    res.status(500).json(apiError);
  }
};

export const createScan: RequestHandler = async (req, res) => {
  try {
    const body = req.body as CreateScanRequest;
    const userId = getUserIdFromAuth(req.headers.authorization);
    
    if (!body.results) {
      const error: ApiError = { error: "Scan results are required", success: false };
      return res.status(400).json(error);
    }

    // Extract enhanced data from results if available
    const poseConfidence = body.results.pose_confidence || body.results.combined_confidence || 0.75;
    const keypointsDetected = body.results.keypoints_detected || 0;
    const analysisType = body.results.analysis_type || 'basic_scan';
    const healthAssessment = body.results.health_assessment || 'unknown';
    
    // Use actual processing time if provided, otherwise estimate
    const processingTime = body.results.processing_time_estimate || 
                          (analysisType === 'sequential_validation' ? 2500 : 1000);
    
    // Use provided model version or determine from analysis type
    const modelVersion = body.results.model_version || 
                        (analysisType === 'sequential_validation' ? 'YOLO-v8-Sequential-1.0' : 'YOLO-v8-Basic-1.0');
    
    // Prepare injury detections with enhanced data
    const injuryDetections = body.injuries?.map(injury => ({
      type: injury,
      confidence: poseConfidence,
      source: analysisType
    })) || [];
    
    // Add injury classification data if available
    if (body.results.injury_classification) {
      injuryDetections.push({
        type: 'classification_result',
        confidence: body.results.injury_classification.confidence || poseConfidence,
        source: analysisType,
        classification_data: body.results.injury_classification
      } as any); // Use 'as any' to allow flexible injury detection structure
    }

    const scanData = {
      user_id: userId,
      rooster_id: body.roosterId || null,
      duration_seconds: body.duration || null,
      
      // Enhanced AI analysis data
      pose_data: body.results || {},
      injury_detections: injuryDetections,
      analysis_confidence: poseConfidence,
      
      // Technical metadata
      processing_time_ms: processingTime,
      model_version: modelVersion,
      fps: 30, // Default for live scanning
      resolution: '640x480', // Default camera resolution
      
      // Status and notes
      status: 'completed',
      notes: body.notes?.trim() || null
    };

    // Temporarily bypass RLS for development by using service role
    const { data: scan, error } = await supabase
      .from('scans')
      .insert([scanData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Map database fields to frontend format
    const mappedScan = {
      id: scan.id,
      roosterId: scan.rooster_id,
      userId: scan.user_id,
      sessionName: scan.session_name,
      scanType: scan.scan_type || 'live_video',
      duration: scan.duration_seconds,
      videoUrl: scan.video_url,
      thumbnailUrl: scan.thumbnail_url,
      status: scan.status || 'completed',
      poseData: scan.pose_data,
      injuryDetections: scan.injury_detections,
      analysisConfidence: scan.analysis_confidence,
      fps: scan.fps,
      resolution: scan.resolution,
      cameraSettings: scan.camera_settings,
      processingTimeMs: scan.processing_time_ms,
      modelVersion: scan.model_version,
      notes: scan.notes,
      createdAt: scan.created_at,
      updatedAt: scan.updated_at,
      // Legacy fields for backward compatibility
      results: scan.pose_data || { posture: "normal", wing: "normal", legs: "normal", movement: "normal" },
      overlay: scan.status === 'completed',
      injuries: Array.isArray(scan.injury_detections) ? scan.injury_detections.map((inj: any) => inj.type || 'Unknown') : [],
      severity: (scan.analysis_confidence > 0.8 ? 'high' : scan.analysis_confidence > 0.5 ? 'medium' : 'low') as "low" | "medium" | "high"
    };
    
    const response: ApiResponse<Scan> = {
      data: mappedScan,
      success: true
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Failed to create scan:', error);
    const apiError: ApiError = { error: "Failed to create scan", success: false };
    res.status(500).json(apiError);
  }
};
