import { RequestHandler } from "express";
import { CreateRoosterRequest, UpdateRoosterRequest, Rooster, ApiResponse, ApiError } from "@shared/api";
import { supabase, getUserIdFromAuth } from "../lib/supabase";

export const getRoosters: RequestHandler = async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req.headers.authorization);
    
    const { data: roosters, error } = await supabase
      .from('roosters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Map database fields to frontend format
    const mappedRoosters = (roosters || []).map(rooster => ({
      id: rooster.id,
      name: rooster.name,
      breed: rooster.breed,
      ageMonths: rooster.age_months,
      weightGrams: rooster.weight_grams,
      color: rooster.color,
      gender: rooster.gender,
      registrationNumber: rooster.registration_number,
      bloodline: rooster.bloodline,
      birthDate: rooster.birth_date,
      acquisitionDate: rooster.acquisition_date,
      status: rooster.status,
      notes: rooster.notes,
      avatarImageUrl: rooster.avatar_image_url,
      createdAt: rooster.created_at,
      updatedAt: rooster.updated_at
    }));

    const response: ApiResponse<Rooster[]> = {
      data: mappedRoosters,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to get roosters:', error);
    const apiError: ApiError = { error: "Failed to fetch roosters", success: false };
    res.status(500).json(apiError);
  }
};

export const createRooster: RequestHandler = async (req, res) => {
  try {
    const body = req.body as CreateRoosterRequest;
    const userId = getUserIdFromAuth(req.headers.authorization);
    
    if (!body.name?.trim()) {
      const error: ApiError = { error: "Name is required", success: false };
      return res.status(400).json(error);
    }

    const roosterData = {
      user_id: userId,
      name: body.name.trim(),
      breed: body.breed?.trim() || null,
      age_months: body.ageMonths || null,
      weight_grams: body.weightGrams || null,
      color: body.color?.trim() || null,
      gender: body.gender?.trim() || null,
      registration_number: body.registrationNumber?.trim() || null,
      bloodline: body.bloodline?.trim() || null,
      birth_date: body.birthDate || null,
      acquisition_date: body.acquisitionDate || null,
      status: body.status?.trim() || 'active',
      notes: body.notes?.trim() || null,
      avatar_image_url: body.avatarImageUrl?.trim() || null
    };

    const { data: rooster, error } = await supabase
      .from('roosters')
      .insert([roosterData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    // Map database fields to frontend format
    const mappedRooster = {
      id: rooster.id,
      name: rooster.name,
      breed: rooster.breed,
      ageMonths: rooster.age_months,
      weightGrams: rooster.weight_grams,
      color: rooster.color,
      gender: rooster.gender,
      registrationNumber: rooster.registration_number,
      bloodline: rooster.bloodline,
      birthDate: rooster.birth_date,
      acquisitionDate: rooster.acquisition_date,
      status: rooster.status,
      notes: rooster.notes,
      avatarImageUrl: rooster.avatar_image_url,
      createdAt: rooster.created_at,
      updatedAt: rooster.updated_at
    };

    const response: ApiResponse<Rooster> = {
      data: mappedRooster,
      success: true
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Failed to create rooster:', error);
    const apiError: ApiError = { error: "Failed to create rooster", success: false };
    res.status(500).json(apiError);
  }
};

export const updateRooster: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body as UpdateRoosterRequest;
    const userId = getUserIdFromAuth(req.headers.authorization);
    
    const updateData: any = {};
    if (body.name?.trim()) updateData.name = body.name.trim();
    if (body.breed?.trim()) updateData.breed = body.breed.trim();
    if (body.ageMonths !== undefined) updateData.age_months = body.ageMonths;
    if (body.weightGrams !== undefined) updateData.weight_grams = body.weightGrams;
    if (body.color?.trim()) updateData.color = body.color.trim();
    if (body.gender?.trim()) updateData.gender = body.gender.trim();
    if (body.registrationNumber?.trim()) updateData.registration_number = body.registrationNumber.trim();
    if (body.bloodline?.trim()) updateData.bloodline = body.bloodline.trim();
    if (body.birthDate) updateData.birth_date = body.birthDate;
    if (body.acquisitionDate) updateData.acquisition_date = body.acquisitionDate;
    if (body.status?.trim()) updateData.status = body.status.trim();
    if (body.notes?.trim()) updateData.notes = body.notes.trim();
    if (body.avatarImageUrl?.trim()) updateData.avatar_image_url = body.avatarImageUrl.trim();

    const { data: rooster, error } = await supabase
      .from('roosters')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        const apiError: ApiError = { error: "Rooster not found", success: false };
        return res.status(404).json(apiError);
      }
      throw error;
    }

    const response: ApiResponse<Rooster> = {
      data: rooster,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to update rooster:', error);
    const apiError: ApiError = { error: "Failed to update rooster", success: false };
    res.status(500).json(apiError);
  }
};

export const deleteRooster: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserIdFromAuth(req.headers.authorization);
    
    const { error } = await supabase
      .from('roosters')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }
    
    const response: ApiResponse<{ deleted: true }> = {
      data: { deleted: true },
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to delete rooster:', error);
    const apiError: ApiError = { error: "Failed to delete rooster", success: false };
    res.status(500).json(apiError);
  }
};
