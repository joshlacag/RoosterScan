import { RequestHandler } from "express";
import { AuthResponse, User, ApiResponse } from "@shared/api";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("SUPABASE_JWT_SECRET environment variable is required");
}

export const getSession: RequestHandler = (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.json({ user: null });
  }
  
  try {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const response: AuthResponse = {
      user: { email: decoded.email }
    };
    
    res.json(response);
  } catch (error) {
    res.json({ user: null });
  }
};

// Middleware to require authentication
export const requireAuth: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ 
      error: "Authentication required. Provide Bearer token.", 
      success: false 
    });
  }
  
  try {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Add user to request for downstream handlers
    (req as any).user = { 
      id: decoded.sub,
      email: decoded.email 
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: "Invalid or expired token.", 
      success: false 
    });
  }
};
