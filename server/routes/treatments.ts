import { RequestHandler } from "express";
import { ApiResponse, ApiError } from "@shared/api";
import { supabase } from "../lib/supabase";

// GET /api/treatments - Get all active treatment protocols
export const getTreatments: RequestHandler = async (req, res) => {
  try {
    const { data: treatments, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('is_active', true)
      .order('injury_type', { ascending: true });

    if (error) {
      throw error;
    }

    const response: ApiResponse<any[]> = {
      data: treatments || [],
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to get treatments:', error);
    const apiError: ApiError = { 
      error: "Failed to fetch treatment protocols", 
      success: false 
    };
    res.status(500).json(apiError);
  }
};

// GET /api/treatments/:injuryType - Get specific treatment protocol by injury type
export const getTreatmentByType: RequestHandler = async (req, res) => {
  try {
    const { injuryType } = req.params;

    const { data: treatment, error } = await supabase
      .from('treatments')
      .select('*')
      .eq('injury_type', injuryType.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        const apiError: ApiError = { 
          error: `Treatment protocol not found for injury type: ${injuryType}`, 
          success: false 
        };
        return res.status(404).json(apiError);
      }
      throw error;
    }

    const response: ApiResponse<any> = {
      data: treatment,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to get treatment:', error);
    const apiError: ApiError = { 
      error: "Failed to fetch treatment protocol", 
      success: false 
    };
    res.status(500).json(apiError);
  }
};
