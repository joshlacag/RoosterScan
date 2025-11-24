import { RequestHandler } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase";
import { ApiResponse, ApiError } from "@shared/api";
import { v4 as uuidv4 } from "uuid";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload image to Supabase Storage
export const uploadImage: RequestHandler = async (req, res) => {
  try {
    if (!req.file) {
      const error: ApiError = { error: "No file provided", success: false };
      return res.status(400).json(error);
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `roosters/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Supabase storage error:', error);
      const apiError: ApiError = { error: "Failed to upload image", success: false };
      return res.status(500).json(apiError);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    const response: ApiResponse<{ url: string }> = {
      data: { url: publicUrlData.publicUrl },
      success: true
    };

    res.json(response);
  } catch (error) {
    console.error('Upload error:', error);
    const apiError: ApiError = { error: "Internal server error", success: false };
    res.status(500).json(apiError);
  }
};

// Middleware to handle single file upload
export const uploadMiddleware = upload.single('image');
