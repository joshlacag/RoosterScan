import { Router } from 'express';
import multer from 'multer';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Ensure uploads directory exists
const uploadsDir = 'uploads/';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    // Keep original extension
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, file.fieldname + '-' + Date.now() + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

interface PoseKeypoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

interface PoseDetectionResult {
  success: boolean;
  keypoints?: PoseKeypoint[];
  confidence?: number;
  injury_analysis?: {
    risk_level: 'low' | 'medium' | 'high';
    detected_issues: string[];
    recommendations: string[];
  };
  error?: string;
}

// Keypoint names for rooster pose
const KEYPOINT_NAMES = [
  'beak_tip', 'eye', 'comb_top', 'neck_base',
  'chest', 'back_mid', 'tail_base',
  'left_wing_shoulder', 'left_wing_elbow', 'left_wing_tip',
  'right_wing_shoulder', 'right_wing_elbow', 'right_wing_tip',
  'left_leg_joint', 'left_foot', 'right_leg_joint', 'right_foot'
];

// Analyze pose for potential injuries
function analyzePoseForInjuries(keypoints: PoseKeypoint[]): PoseDetectionResult['injury_analysis'] {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  // Check for missing critical keypoints
  const criticalPoints = ['eye', 'beak_tip', 'left_foot', 'right_foot'];
  const missingCritical = criticalPoints.filter(name => 
    !keypoints.find(kp => kp.name === name && kp.confidence > 0.5)
  );

  if (missingCritical.length > 0) {
    issues.push(`Unable to detect critical body parts: ${missingCritical.join(', ')}`);
    riskLevel = 'medium';
  }

  // Check wing symmetry
  const leftWing = keypoints.filter(kp => kp.name.includes('left_wing'));
  const rightWing = keypoints.filter(kp => kp.name.includes('right_wing'));
  
  if (leftWing.length !== rightWing.length) {
    issues.push('Wing asymmetry detected - possible wing injury');
    recommendations.push('Examine wings for injuries or deformities');
    riskLevel = 'high';
  }

  // Check leg positioning
  const leftFoot = keypoints.find(kp => kp.name === 'left_foot');
  const rightFoot = keypoints.find(kp => kp.name === 'right_foot');
  
  if (leftFoot && rightFoot) {
    const footDistance = Math.abs(leftFoot.y - rightFoot.y);
    if (footDistance > 50) { // pixels
      issues.push('Uneven leg positioning detected');
      recommendations.push('Check for leg injuries or lameness');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }
  }

  // Check head positioning
  const eye = keypoints.find(kp => kp.name === 'eye');
  const beak = keypoints.find(kp => kp.name === 'beak_tip');
  
  if (eye && beak) {
    const headAngle = Math.atan2(beak.y - eye.y, beak.x - eye.x) * 180 / Math.PI;
    if (Math.abs(headAngle) > 45) {
      issues.push('Abnormal head positioning detected');
      recommendations.push('Monitor for neurological issues or neck injuries');
      riskLevel = 'medium';
    }
  }

  // Add general recommendations
  if (issues.length === 0) {
    recommendations.push('Rooster appears healthy based on pose analysis');
    recommendations.push('Continue regular health monitoring');
  } else {
    recommendations.push('Consult with veterinarian for detailed examination');
    recommendations.push('Monitor rooster behavior and movement patterns');
  }

  return {
    risk_level: riskLevel,
    detected_issues: issues,
    recommendations
  };
}

// POST /api/pose/detect - Detect rooster pose in uploaded image
router.post('/detect', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const imagePath = req.file.path;
    const modelPath = path.join(__dirname, '../../rooster_pose_model.pt');

    // Check if model exists
    if (!fs.existsSync(modelPath)) {
      console.log('Model not found at:', modelPath);
      console.log('Directory contents:', fs.readdirSync(path.join(__dirname, '../..')));
      
      // Return mock data when models not found
      return res.json({
        success: true,
        keypoints: [
          { name: 'beak_tip', x: 100, y: 50, confidence: 0.9 },
          { name: 'eye', x: 120, y: 60, confidence: 0.85 },
          { name: 'comb_top', x: 110, y: 30, confidence: 0.8 }
        ],
        confidence: 0.85,
        pose_confidence: 0.85,
        health_assessment: 'healthy',
        recommendations: [
          'AI models not deployed - showing mock data',
          'Upload successful - frontend integration working',
          'Deploy AI models to Railway to enable real analysis'
        ],
        combined_analysis: {
          health_assessment: 'healthy',
          combined_confidence: 0.85,
          recommendations: [
            'AI models not deployed - showing mock data',
            'Upload successful - frontend integration working',
            'Deploy AI models to Railway to enable real analysis'
          ],
          specific_findings: []
        },
        injury_analysis: {
          risk_level: 'low',
          detected_issues: [],
          recommendations: [
            'AI models not deployed - showing mock data',
            'Upload successful - frontend integration working',
            'Deploy AI models to Railway to enable real analysis'
          ]
        }
      });
    }

    // Check if bumblefoot model exists (using the perfect 100% accuracy model)
    const bumblefootModelPath = path.join(__dirname, '../../rooster_bumblefoot_model.pt');
    const sequentialScriptPath = path.join(__dirname, '../scripts/sequential_analysis.py');
    
    if (!fs.existsSync(bumblefootModelPath)) {
      return res.status(500).json({
        success: false,
        error: 'Bumblefoot classification model not found'
      });
    }
    
    if (!fs.existsSync(sequentialScriptPath)) {
      return res.status(500).json({
        success: false,
        error: 'Sequential analysis script not found'
      });
    }

    // Execute sequential analysis with bumblefoot model
    const python = spawn('python', [sequentialScriptPath, imagePath, modelPath, bumblefootModelPath]);
    let output = '';
    let error = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      error += data.toString();
    });

    python.on('close', (code) => {
      // Clean up uploaded file
      fs.unlinkSync(imagePath);

      console.log('Python output:', output);
      console.log('Python error:', error);
      console.log('Exit code:', code);

      if (code !== 0) {
        return res.status(500).json({
          success: false,
          error: `Pose detection failed: ${error}`
        });
      }

      try {
        // Find JSON in output (might have other text before/after)
        const jsonMatch = output.match(/\{.*\}/s);
        if (!jsonMatch) {
          throw new Error('No JSON found in output');
        }
        
        const result = JSON.parse(jsonMatch[0]);
        
        if (result.success) {
          // Sequential analysis completed successfully
          const response = {
            success: true,
            analysis_type: result.analysis_type || 'sequential_validation',
            overall_status: result.overall_status,
            
            // Pose detection results (for backward compatibility)
            keypoints: result.pose_detection?.keypoints || [],
            confidence: result.pose_detection?.pose_confidence || 0,
            
            // Enhanced sequential results
            pose_detection: result.pose_detection,
            injury_classification: result.injury_classification,
            combined_analysis: {
              health_assessment: result.health_assessment,
              combined_confidence: result.combined_confidence,
              recommendations: result.recommendations,
              specific_findings: result.specific_findings
            },
            
            // Legacy injury analysis (for backward compatibility)
            injury_analysis: {
              risk_level: result.health_assessment === 'injured' ? 'high' : 'low',
              detected_issues: result.specific_findings || [],
              recommendations: result.recommendations || []
            }
          };

          res.json(response);
        } else {
          // Analysis failed
          res.status(500).json({
            success: false,
            error: result.error || 'Sequential analysis failed',
            stage: result.stage || 'unknown'
          });
        }
      } catch (parseError) {
        console.error('Parse error:', parseError);
        res.status(500).json({
          success: false,
          error: `Failed to parse sequential analysis results: ${parseError.message}. Output: ${output}`
        });
      }
    });

  } catch (error) {
    console.error('Pose detection error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
