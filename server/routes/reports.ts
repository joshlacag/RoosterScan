import { RequestHandler } from "express";
import { CreateReportRequest, HealthReport, ApiResponse, ApiError } from "@shared/api";
import { supabase, getUserIdFromAuth } from "../lib/supabase";

export const getReports: RequestHandler = async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req.headers.authorization);
    
    const { data: reports, error } = await supabase
      .from('health_reports')
      .select(`
        *,
        scans!inner(id, rooster_id, created_at),
        roosters!inner(id, name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Map database fields to frontend format
    const mappedReports = (reports || []).map(report => ({
      id: report.id,
      scanId: report.scan_id,
      roosterId: report.rooster_id,
      userId: report.user_id,
      title: report.title,
      summary: report.summary,
      detailedAnalysis: report.detailed_analysis,
      recommendations: report.recommendations,
      overallHealthScore: report.overall_health_score,
      mobilityScore: report.mobility_score,
      postureScore: report.posture_score,
      totalInjuriesDetected: report.total_injuries_detected,
      highPriorityInjuries: report.high_priority_injuries,
      reportType: report.report_type,
      status: report.status,
      pdfUrl: report.pdf_url,
      images: report.images,
      createdAt: report.created_at,
      updatedAt: report.updated_at
    }));

    const response: ApiResponse<HealthReport[]> = {
      data: mappedReports,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to get reports:', error);
    const apiError: ApiError = { error: "Failed to fetch reports", success: false };
    res.status(500).json(apiError);
  }
};

export const createReport: RequestHandler = async (req, res) => {
  try {
    const body = req.body as CreateReportRequest;
    const userId = getUserIdFromAuth(req.headers.authorization);
    
    if (!body.scanId || !body.roosterId || !body.title?.trim()) {
      const error: ApiError = { error: "scanId, roosterId, and title are required", success: false };
      return res.status(400).json(error);
    }

    // Verify scan exists and belongs to user
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, injury_detections')
      .eq('id', body.scanId)
      .eq('user_id', userId)
      .single();

    if (scanError || !scan) {
      const error: ApiError = { error: "Scan not found or access denied", success: false };
      return res.status(404).json(error);
    }

    // Calculate injury counts from scan data
    const injuryDetections = scan.injury_detections || [];
    const totalInjuries = Array.isArray(injuryDetections) ? injuryDetections.length : 0;
    const highPriorityInjuries = Array.isArray(injuryDetections) 
      ? injuryDetections.filter((inj: any) => inj.severity === 'severe').length 
      : 0;

    const reportData = {
      scan_id: body.scanId,
      rooster_id: body.roosterId,
      user_id: userId,
      title: body.title.trim(),
      summary: body.summary?.trim() || null,
      detailed_analysis: body.detailedAnalysis?.trim() || null,
      recommendations: body.recommendations?.trim() || null,
      overall_health_score: body.overallHealthScore || null,
      mobility_score: body.mobilityScore || null,
      posture_score: body.postureScore || null,
      total_injuries_detected: totalInjuries,
      high_priority_injuries: highPriorityInjuries,
      report_type: body.reportType || 'automated',
      status: 'draft'
    };

    const { data: report, error } = await supabase
      .from('health_reports')
      .insert([reportData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    // Map database fields to frontend format
    const mappedReport = {
      id: report.id,
      scanId: report.scan_id,
      roosterId: report.rooster_id,
      userId: report.user_id,
      title: report.title,
      summary: report.summary,
      detailedAnalysis: report.detailed_analysis,
      recommendations: report.recommendations,
      overallHealthScore: report.overall_health_score,
      mobilityScore: report.mobility_score,
      postureScore: report.posture_score,
      totalInjuriesDetected: report.total_injuries_detected,
      highPriorityInjuries: report.high_priority_injuries,
      reportType: report.report_type,
      status: report.status,
      pdfUrl: report.pdf_url,
      images: report.images,
      createdAt: report.created_at,
      updatedAt: report.updated_at
    };

    const response: ApiResponse<HealthReport> = {
      data: mappedReport,
      success: true
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Failed to create report:', error);
    const apiError: ApiError = { error: "Failed to create report", success: false };
    res.status(500).json(apiError);
  }
};
