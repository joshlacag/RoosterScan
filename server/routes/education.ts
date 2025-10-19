import { Router } from 'express';
import { supabase, getUserIdFromAuth } from '../lib/supabase';
import { ApiResponse, ApiError } from '../../shared/api';

const router = Router();

// Educational content interface
interface EducationalContent {
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

// GET /api/education - Get all educational content with optional filters
router.get('/', async (req, res) => {
  try {
    // Educational content is publicly accessible - no auth required
    const { category, difficulty, type, featured, search } = req.query;

    let query = supabase
      .from('educational_content')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    if (difficulty) {
      query = query.eq('difficulty_level', difficulty);
    }
    if (type) {
      query = query.eq('content_type', type);
    }
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: content, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    const response: ApiResponse<EducationalContent[]> = {
      data: content || [],
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to fetch educational content:', error);
    const apiError: ApiError = { error: "Failed to fetch educational content", success: false };
    res.status(500).json(apiError);
  }
});

// GET /api/education/:id - Get specific educational content
router.get('/:id', async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req.headers.authorization);
    const { id } = req.params;

    const { data: content, error } = await supabase
      .from('educational_content')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        const apiError: ApiError = { error: "Educational content not found", success: false };
        return res.status(404).json(apiError);
      }
      throw error;
    }

    // Increment view count
    await supabase
      .from('educational_content')
      .update({ view_count: (content.view_count || 0) + 1 })
      .eq('id', id);

    const response: ApiResponse<EducationalContent> = {
      data: content,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to fetch educational content:', error);
    const apiError: ApiError = { error: "Failed to fetch educational content", success: false };
    res.status(500).json(apiError);
  }
});

// GET /api/education/categories - Get available categories with counts
router.get('/meta/categories', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('educational_content')
      .select('category')
      .eq('is_published', true);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Count categories
    const categoryCounts = categories?.reduce((acc: Record<string, number>, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {}) || {};

    const response: ApiResponse<Record<string, number>> = {
      data: categoryCounts,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    const apiError: ApiError = { error: "Failed to fetch categories", success: false };
    res.status(500).json(apiError);
  }
});

// POST /api/education/:id/progress - Track user progress on educational content
router.post('/:id/progress', async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req.headers.authorization);
    const { id } = req.params;
    const { progress_percentage, completed, time_spent_minutes } = req.body;

    // Upsert user progress
    const { data: progressData, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        content_id: id,
        progress_percentage: progress_percentage || 0,
        completed: completed || false,
        time_spent_minutes: time_spent_minutes || 0,
        last_accessed: new Date().toISOString()
      }, {
        onConflict: 'user_id,content_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    const response: ApiResponse<any> = {
      data: progressData,
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to update progress:', error);
    const apiError: ApiError = { error: "Failed to update progress", success: false };
    res.status(500).json(apiError);
  }
});

// GET /api/education/user/progress - Get user's progress on all content
router.get('/user/progress', async (req, res) => {
  try {
    const userId = getUserIdFromAuth(req.headers.authorization);

    const { data: progress, error } = await supabase
      .from('user_progress')
      .select(`
        *,
        educational_content (
          id,
          title,
          content_type,
          category,
          thumbnail_url
        )
      `)
      .eq('user_id', userId)
      .order('last_accessed', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    const response: ApiResponse<any[]> = {
      data: progress || [],
      success: true
    };
    res.json(response);
  } catch (error) {
    console.error('Failed to fetch user progress:', error);
    const apiError: ApiError = { error: "Failed to fetch user progress", success: false };
    res.status(500).json(apiError);
  }
});

export default router;
