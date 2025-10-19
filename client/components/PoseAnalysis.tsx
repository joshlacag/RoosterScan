import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, AlertTriangle, CheckCircle, Info, Target, Brain, Activity, TrendingUp, Eye, Sparkles, Save, ArrowRight, Stethoscope, Search, FileText, Shield, AlertCircle, Bird, ChevronDown, ChevronUp, Pill, Syringe, Heart, Home, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Rooster } from '@shared/api';

interface PoseKeypoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

interface InjuryAnalysis {
  risk_level: 'low' | 'medium' | 'high';
  detected_issues: string[];
  recommendations: string[];
}

interface PoseDetectionResult {
  success: boolean;
  stage: string;
  keypoints?: PoseKeypoint[];
  pose_confidence?: number;
  keypoints_detected?: number;
  quality_gate_passed?: boolean;
  quality_assessment?: string;
  error?: string;
}

interface InjuryClassificationResult {
  success: boolean;
  stage: string;
  classification?: 'healthy' | 'injured';
  confidence?: number;
  probabilities?: Record<string, number>;
  skipped?: boolean;
  error?: string;
}

interface CombinedAnalysis {
  health_assessment?: 'healthy' | 'injured' | 'bumblefoot';
  combined_confidence?: number;
  recommendations?: string[];
  specific_findings?: string[];
}

interface PoseResult {
  success: boolean;
  // Legacy properties (for backward compatibility)
  keypoints?: PoseKeypoint[];
  confidence?: number;
  injury_analysis?: InjuryAnalysis;
  error?: string;
  
  // Sequential validation properties
  analysis_type?: 'sequential_validation';
  overall_status?: 'analysis_complete' | 'insufficient_quality' | 'pose_detection_failed' | 'injury_classification_failed' | 'injury_analysis_skipped';
  pose_detection?: PoseDetectionResult;
  injury_classification?: InjuryClassificationResult;
  combined_analysis?: CombinedAnalysis;
}

export default function PoseAnalysis() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PoseResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [savedScanId, setSavedScanId] = useState<string | null>(null);
  const [roosters, setRoosters] = useState<Rooster[]>([]);
  const [selectedRoosterId, setSelectedRoosterId] = useState<string>('');
  const [expandedTreatment, setExpandedTreatment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load roosters on component mount
  useEffect(() => {
    loadRoosters();
  }, []);

  const loadRoosters = async () => {
    try {
      const data = await api.getRoosters();
      setRoosters(data);
    } catch (error) {
      console.error('Failed to load roosters:', error);
      // Don't show error toast, just log it
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    handleFile(file);
  };

  const handleFile = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResult(null);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const drawPoseOnCanvas = (imageUrl: string, keypoints: PoseKeypoint[]) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('Canvas ref not found');
      return;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not found');
      return;
    }

    console.log('Drawing pose on canvas with:', { imageUrl, keypoints });
    
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS issues
    
    img.onload = () => {
      console.log('Image loaded successfully:', img.width, 'x', img.height);
      
      // Set canvas to match image aspect ratio (max width 1200px)
      const maxWidth = 1200;
      const scale = Math.min(maxWidth / img.width, 1); // Don't upscale
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw full image (no black bars!)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Draw keypoints with scaling
      keypoints.forEach((kp, index) => {
        if (kp.confidence > 0.5) {
          const scaledX = kp.x * scale;
          const scaledY = kp.y * scale;
          
          console.log(`Drawing keypoint ${index}: ${kp.name} at (${scaledX}, ${scaledY})`);
          
          // Draw keypoint circle with glow
          const gradient = ctx.createRadialGradient(scaledX, scaledY, 0, scaledX, scaledY, 12);
          gradient.addColorStop(0, 'rgba(244, 63, 94, 0.9)');
          gradient.addColorStop(1, 'rgba(244, 63, 94, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(scaledX, scaledY, 12, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw keypoint dot
          ctx.beginPath();
          ctx.arc(scaledX, scaledY, 6, 0, 2 * Math.PI);
          ctx.fillStyle = '#f43f5e';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw keypoint label with background
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.font = 'bold 11px system-ui';
          const textWidth = ctx.measureText(kp.name).width;
          ctx.fillRect(scaledX + 8, scaledY - 18, textWidth + 6, 16);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(kp.name, scaledX + 11, scaledY - 7);
        }
      });
      
      console.log('Canvas drawing completed');
    };
    
    img.onerror = (error) => {
      console.error('Failed to load image:', error, imageUrl);
      // Fallback: draw keypoints only
      drawKeypointsOnly(ctx, keypoints);
    };
    
    img.src = imageUrl;
  };

  const drawKeypointsOnly = (ctx: CanvasRenderingContext2D, keypoints: PoseKeypoint[]) => {
    console.log('Drawing keypoints only (no background image)');
    
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Draw keypoints
    keypoints.forEach((kp, index) => {
      if (kp.confidence > 0.5) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = '#ff0000';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.fillText(`${kp.name}`, kp.x + 10, kp.y - 10);
      }
    });
  };

  const getKeypointColor = (name: string): string => {
    const colorMap: Record<string, string> = {
      'beak_tip': '#ff0000',
      'eye': '#00ff00',
      'comb_top': '#0000ff',
      'neck_base': '#ffff00',
      'chest': '#ff00ff',
      'back_mid': '#00ffff',
      'tail_base': '#800080',
      'left_wing_shoulder': '#ffa500',
      'left_wing_elbow': '#ffc0cb',
      'left_wing_tip': '#add8e6',
      'right_wing_shoulder': '#ffa500',
      'right_wing_elbow': '#ffc0cb',
      'right_wing_tip': '#add8e6',
      'left_leg_joint': '#008000',
      'left_foot': '#808000',
      'right_leg_joint': '#008000',
      'right_foot': '#808000'
    };
    return colorMap[name] || '#ffffff';
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, keypoints: PoseKeypoint[]) => {
    const connections = [
      ['beak_tip', 'eye'],
      ['eye', 'comb_top'],
      ['eye', 'neck_base'],
      ['neck_base', 'chest'],
      ['chest', 'back_mid'],
      ['back_mid', 'tail_base'],
      ['chest', 'left_wing_shoulder'],
      ['left_wing_shoulder', 'left_wing_elbow'],
      ['left_wing_elbow', 'left_wing_tip'],
      ['chest', 'right_wing_shoulder'],
      ['right_wing_shoulder', 'right_wing_elbow'],
      ['right_wing_elbow', 'right_wing_tip'],
      ['back_mid', 'left_leg_joint'],
      ['left_leg_joint', 'left_foot'],
      ['back_mid', 'right_leg_joint'],
      ['right_leg_joint', 'right_foot']
    ];

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    connections.forEach(([start, end]) => {
      const startKp = keypoints.find(kp => kp.name === start);
      const endKp = keypoints.find(kp => kp.name === end);
      
      if (startKp && endKp && startKp.confidence > 0.5 && endKp.confidence > 0.5) {
        ctx.beginPath();
        ctx.moveTo(startKp.x, startKp.y);
        ctx.lineTo(endKp.x, endKp.y);
        ctx.stroke();
      }
    });
  };

  const saveScanToDatabase = async (data: PoseResult) => {
    try {
      // Convert image to base64 for storage
      let imageDataUrl = '';
      if (selectedFile) {
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }

      // Prepare scan data from AI results
      const scanData = {
        roosterId: selectedRoosterId || null, // Use selected rooster if available
        results: {
          // Store image in results JSON
          imageUrl: imageDataUrl,
          posture: 'analyzed',
          wing: data.pose_detection?.quality_gate_passed ? 'normal' : 'check',
          legs: data.pose_detection?.quality_gate_passed ? 'normal' : 'check',
          movement: 'stable',
          
          // Enhanced AI analysis data
          pose_confidence: data.pose_detection?.pose_confidence || 0,
          keypoints_detected: data.pose_detection?.keypoints_detected || 0,
          analysis_type: data.analysis_type || 'pose_analysis',
          health_assessment: data.combined_analysis?.health_assessment || data.injury_classification?.classification || 'unknown',
          
          // Additional metadata
          combined_confidence: data.combined_analysis?.combined_confidence || data.pose_detection?.pose_confidence || 0,
          quality_gate_passed: data.pose_detection?.quality_gate_passed || false,
          recommendations: data.combined_analysis?.recommendations || [],
          specific_findings: data.combined_analysis?.specific_findings || [],
          
          // Store keypoints for visualization
          keypoints: data.pose_detection?.keypoints || data.keypoints || [],
          
          // Technical metadata
          model_version: 'YOLO-v8-Sequential-1.0',
          processing_time_estimate: 2500
        },
        overlay: true,
        injuries: data.injury_classification?.classification && data.injury_classification.classification !== 'healthy' 
          ? [data.injury_classification.classification] 
          : [],
        severity: data.combined_analysis?.combined_confidence && data.combined_analysis.combined_confidence > 0.8 
          ? 'high' as const
          : data.combined_analysis?.combined_confidence && data.combined_analysis.combined_confidence > 0.6 
            ? 'medium' as const
            : 'low' as const,
        notes: `AI Pose Analysis - ${data.pose_detection?.keypoints_detected || 0} keypoints detected`,
        duration: 0
      };

      const savedScan = await api.createScan(scanData);
      
      // Set the saved scan ID for the "View Full Report" button
      setSavedScanId(savedScan.id);
      
      // Navigate to results page
      toast.success('Analysis saved successfully!');
      navigate(`/scan-results/${savedScan.id}`);
    } catch (error) {
      console.error('Failed to save scan:', error);
      toast.error('Analysis complete but failed to save. You can still see results above.');
    }
  };

  const analyzePose = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/pose/detect', {
        method: 'POST',
        body: formData,
      });

      const data: PoseResult = await response.json();

      // Save scan to database and redirect immediately (don't show results here)
      if (data.success && data.analysis_type === 'sequential_validation') {
        await saveScanToDatabase(data);
        // Function will navigate away, so we don't set results or draw
        return;
      }

      // Only set results and draw if we're NOT redirecting (fallback for non-sequential)
      setResult(data);

      // Draw pose visualization after component re-renders
      if (data.success && data.keypoints) {
        setTimeout(() => {
          if (previewUrl) {
            drawPoseOnCanvas(previewUrl, data.keypoints!);
          } else {
            // Fallback: draw keypoints only
            const canvas = canvasRef.current;
            if (canvas) {
              const ctx = canvas.getContext('2d');
              if (ctx) {
                drawKeypointsOnly(ctx, data.keypoints!);
              }
            }
          }
        }, 100); // Small delay to ensure canvas is rendered
      }
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to analyze pose. Please try again.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!result) return;
    
    try {
      // Convert image to base64 for storage
      let imageDataUrl = '';
      if (selectedFile) {
        const reader = new FileReader();
        imageDataUrl = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(selectedFile);
        });
      }

      // Prepare scan data from AI results
      const scanData = {
        roosterId: null,
        results: {
          imageUrl: imageDataUrl,
          posture: 'analyzed',
          wing: result.pose_detection?.quality_gate_passed ? 'normal' : 'check',
          legs: result.pose_detection?.quality_gate_passed ? 'normal' : 'check',
          movement: 'stable',
          pose_confidence: result.pose_detection?.pose_confidence || 0,
          keypoints_detected: result.pose_detection?.keypoints_detected || 0,
          analysis_type: result.analysis_type || 'pose_analysis',
          health_assessment: result.combined_analysis?.health_assessment || result.injury_classification?.classification || 'unknown',
          combined_confidence: result.combined_analysis?.combined_confidence || result.pose_detection?.pose_confidence || 0,
          quality_gate_passed: result.pose_detection?.quality_gate_passed || false,
          recommendations: result.combined_analysis?.recommendations || [],
          specific_findings: result.combined_analysis?.specific_findings || [],
          keypoints: result.pose_detection?.keypoints || result.keypoints || [],
          model_version: 'YOLO-v8-Sequential-1.0',
          processing_time_estimate: 2500
        },
        overlay: true,
        injuries: result.injury_classification?.classification && result.injury_classification.classification !== 'healthy' 
          ? [result.injury_classification.classification] 
          : [],
        severity: result.combined_analysis?.combined_confidence && result.combined_analysis.combined_confidence > 0.8 
          ? 'high' as const
          : result.combined_analysis?.combined_confidence && result.combined_analysis.combined_confidence > 0.6 
            ? 'medium' as const
            : 'low' as const,
        notes: `AI Pose Analysis - ${result.pose_detection?.keypoints_detected || 0} keypoints detected`,
        duration: 0
      };

      const savedScan = await api.createScan(scanData);
      setSavedScanId(savedScan.id);
      
    } catch (error) {
      console.error('Failed to save scan:', error);
      throw error;
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="w-5 h-5" />;
      case 'medium': return <Info className="w-5 h-5" />;
      case 'high': return <AlertTriangle className="w-5 h-5" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getTreatmentGuide = (healthStatus: string) => {
    switch (healthStatus?.toLowerCase()) {
      case 'bumblefoot':
        return {
          title: 'Bumblefoot Treatment Protocol',
          icon: <Pill className="h-5 w-5" />,
          steps: [
            {
              title: 'Immediate First Aid',
              icon: <Syringe className="h-4 w-4" />,
              actions: [
                'Soak affected foot in warm Epsom salt solution (15 minutes)',
                'Gently clean the affected area with antiseptic solution',
                'Apply antibiotic ointment (Neosporin or similar)',
                'Wrap with sterile gauze if actively bleeding'
              ]
            },
            {
              title: 'Veterinary Treatment',
              icon: <Stethoscope className="h-4 w-4" />,
              actions: [
                'Schedule vet appointment within 24-48 hours',
                'Vet may prescribe oral antibiotics (Baytril, Amoxicillin)',
                'Severe cases may require surgical removal of core',
                'Follow vet instructions for wound care and medication'
              ]
            },
            {
              title: 'Home Care & Recovery',
              icon: <Home className="h-4 w-4" />,
              actions: [
                'Isolate bird in clean, soft-bedded area',
                'Change bandages daily, keep wound clean and dry',
                'Monitor for signs of infection (heat, swelling, odor)',
                'Provide easy access to food and water',
                'Continue treatment for 7-14 days or until healed'
              ]
            },
            {
              title: 'Prevention',
              icon: <Shield className="h-4 w-4" />,
              actions: [
                'Replace rough or sharp perches with smooth, rounded ones',
                'Keep coop clean and dry to prevent bacterial growth',
                'Provide varied perch heights and widths',
                'Regular foot inspections during health checks',
                'Maintain proper nutrition for immune system support'
              ]
            }
          ]
        };
      case 'wing_injury':
      case 'injured':
        return {
          title: 'Wing Injury Treatment Protocol',
          icon: <Heart className="h-5 w-5" />,
          steps: [
            {
              title: 'Immediate Assessment',
              icon: <Eye className="h-4 w-4" />,
              actions: [
                'Check for obvious fractures, dislocations, or open wounds',
                'Assess range of motion gently - do not force movement',
                'Look for swelling, bruising, or abnormal positioning',
                'Note if bird can still move wing or if it\'s completely drooping'
              ]
            },
            {
              title: 'Emergency Care',
              icon: <AlertCircle className="h-4 w-4" />,
              actions: [
                'Confine bird to small, quiet space to limit movement',
                'Do NOT attempt to splint without veterinary guidance',
                'If bleeding, apply gentle pressure with clean gauze',
                'Keep bird calm and minimize stress',
                'Contact avian veterinarian immediately'
              ]
            },
            {
              title: 'Veterinary Treatment',
              icon: <Stethoscope className="h-4 w-4" />,
              actions: [
                'X-rays to determine extent of injury',
                'Professional splinting or bandaging if needed',
                'Pain medication and anti-inflammatory drugs',
                'Antibiotics if open wound or infection risk',
                'Follow-up appointments to monitor healing'
              ]
            },
            {
              title: 'Recovery Period',
              icon: <Clock className="h-4 w-4" />,
              actions: [
                'Keep bird confined for 2-4 weeks depending on severity',
                'Prevent flying or jumping during recovery',
                'Monitor splint/bandage - change if wet or soiled',
                'Gradual reintroduction to flock after healing',
                'Full recovery may take 4-8 weeks for fractures'
              ]
            }
          ]
        };
      case 'feather_loss':
        return {
          title: 'Feather Loss Treatment Protocol',
          icon: <Search className="h-5 w-5" />,
          steps: [
            {
              title: 'Identify the Cause',
              icon: <Search className="h-4 w-4" />,
              actions: [
                'Check for external parasites (mites, lice) - look under wings',
                'Observe flock behavior for bullying or pecking',
                'Consider seasonal molting (normal in fall)',
                'Assess diet quality and protein levels',
                'Check for signs of stress or environmental issues'
              ]
            },
            {
              title: 'Parasite Treatment',
              icon: <Pill className="h-4 w-4" />,
              actions: [
                'Apply poultry dust or spray (permethrin-based)',
                'Treat entire flock, not just affected bird',
                'Clean and treat coop, nesting boxes, and perches',
                'Repeat treatment in 7-10 days to kill newly hatched parasites',
                'Provide dust bath area with diatomaceous earth'
              ]
            },
            {
              title: 'Nutritional Support',
              icon: <Heart className="h-4 w-4" />,
              actions: [
                'Increase protein to 18-20% during feather regrowth',
                'Add supplements: omega-3, biotin, methionine',
                'Offer treats: mealworms, sunflower seeds, eggs',
                'Ensure constant access to fresh, clean water',
                'Consider poultry vitamin supplement in water'
              ]
            },
            {
              title: 'Environmental Management',
              icon: <Home className="h-4 w-4" />,
              actions: [
                'Ensure adequate space (4 sq ft per bird indoors)',
                'Improve ventilation to reduce stress',
                'Provide enrichment: perches, dust baths, foraging areas',
                'Separate aggressive birds if pecking is observed',
                'Monitor progress - new feathers should appear in 2-3 weeks'
              ]
            }
          ]
        };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40">
      <div className="max-w-6xl mx-auto p-6">
        {/* Clean Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/70 rounded-xl mb-4 shadow">
            <Camera className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-3">
            AI Pose Analysis
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            Upload a rooster image for automated pose detection and health analysis
          </p>
          
          {/* Instructions - Enhanced */}
          <div className="max-w-3xl mx-auto bg-primary/5 border border-primary/20 rounded-lg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              How to Get Best Results
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-base">✓</span>
                <div>
                  <strong className="text-foreground">Side view (Profile):</strong>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Capture from the side at 90° angle. Shows all 17 keypoints clearly (head, wings, legs, tail).
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-base">✓</span>
                <div>
                  <strong className="text-foreground">Good lighting:</strong>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Natural daylight or bright indoor lighting. Avoid shadows on the rooster's body.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-base">✓</span>
                <div>
                  <strong className="text-foreground">Full body visible:</strong>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Include entire rooster from beak to tail tip. Don't crop out wings, legs, or head.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-base">✓</span>
                <div>
                  <strong className="text-foreground">Clear background:</strong>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Plain, contrasting background (grass, concrete, or solid color). Avoid clutter.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-base">✓</span>
                <div>
                  <strong className="text-foreground">Camera distance:</strong>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Stand 3-5 feet (1-1.5 meters) away. Rooster should fill 60-80% of the frame.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-primary font-bold text-base">✓</span>
                <div>
                  <strong className="text-foreground">Rooster posture:</strong>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    Natural standing position. Wait for rooster to stand still (not walking or jumping).
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-primary/20">
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span><strong className="text-foreground">Tip:</strong> Close-up images of specific areas (feet, wings, head) also work for detailed inspection!</span>
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-background border rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Upload Image</h2>
            
            <div 
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : selectedFile 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {selectedFile ? (
                <div className="space-y-3">
                  <CheckCircle className="w-12 h-12 text-primary mx-auto" />
                  <div className="px-4">
                    <p className="font-medium text-foreground">Ready to analyze</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-full" title={selectedFile.name}>
                      {selectedFile.name.length > 40 
                        ? `${selectedFile.name.substring(0, 20)}...${selectedFile.name.substring(selectedFile.name.length - 15)}`
                        : selectedFile.name
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium text-foreground">
                      {dragActive ? 'Drop image here' : 'Click to upload'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports JPG, PNG, WebP
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Rooster Selection Dropdown - Always visible */}
            <div className="mt-6 space-y-2">
              <Label htmlFor="rooster-select" className="text-sm font-medium flex items-center gap-2">
                <Bird className="h-4 w-4 text-primary" />
                Link to Rooster (Optional)
              </Label>
              <select
                id="rooster-select"
                value={selectedRoosterId}
                onChange={(e) => setSelectedRoosterId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">No rooster selected (General scan)</option>
                {roosters.map((rooster) => (
                  <option key={rooster.id} value={rooster.id}>
                    {rooster.name} {rooster.breed ? `- ${rooster.breed}` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                {selectedRoosterId 
                  ? '✓ This scan will be linked to the selected rooster\'s health history' 
                  : 'Select a rooster to track this scan in their health history'}
              </p>
            </div>

            {selectedFile && (
              <div className="mt-4 space-y-4">
                <button
                  onClick={analyzePose}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-6 py-3 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 font-medium"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      Analyze Pose
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setResult(null);
                  }}
                  className="w-full text-muted-foreground hover:text-foreground py-2 text-sm transition-colors"
                >
                  Choose different image
                </button>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          <div>
            {previewUrl && (
              <div className="bg-background border rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Preview</h3>
                <div className="relative">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-foreground font-medium">Processing...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading Skeleton */}
        {isAnalyzing && !result && (
          <div className="space-y-8 mt-8 fade-in">
            <div className="border-b pb-4">
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            
            <div className="space-y-6">
              {/* Pose Detection Skeleton */}
              <div>
                <Skeleton className="h-6 w-40 mb-4" />
                <Skeleton className="h-96 w-full rounded-xl mb-4" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                  <Skeleton className="h-20 rounded-lg" />
                </div>
              </div>
              
              {/* Health Assessment Skeleton */}
              <div>
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
              
              {/* Recommendations Skeleton */}
              <div>
                <Skeleton className="h-6 w-44 mb-4" />
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                  <Skeleton className="h-16 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-8 mt-8 fade-in">
            {/* Clean Header */}
            <div className="border-b pb-4">
              <h2 className="text-2xl font-semibold text-foreground">Analysis Results</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
              </p>
            </div>
          
          {result.success ? (
            <div className="space-y-6">
              {/* Pose Analysis - Clean Layout */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-4">Pose Detection</h3>
                  
                  {/* Hero Image with Gradient Overlay */}
                  <div className="relative rounded-xl overflow-hidden shadow-2xl mb-8">
                    <canvas
                      ref={canvasRef}
                      className="w-full h-auto"
                    />
                    {/* Gradient overlay at bottom - Only show if keypoints detected */}
                    {(result.keypoints?.filter(kp => kp.confidence > 0.5).length || 0) > 0 ? (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                                <Target className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold">
                                  {result.keypoints?.filter(kp => kp.confidence > 0.5).length || 0}/17
                                </div>
                                <div className="text-xs text-white/70">Keypoints</div>
                              </div>
                            </div>
                            <div className="h-12 w-px bg-white/20" />
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                                <TrendingUp className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="text-2xl font-bold">
                                  {result.confidence ? (result.confidence * 100).toFixed(0) : 0}%
                                </div>
                                <div className="text-xs text-white/70">Confidence</div>
                              </div>
                            </div>
                          </div>
                          <div className="px-4 py-2 bg-green-500 rounded-lg font-semibold text-sm shadow-lg">
                            Analysis Complete
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Close-up analysis badge - Show when no keypoints detected */
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/20 backdrop-blur-sm rounded-lg">
                              <Search className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold">Close-up Analysis</div>
                              <div className="text-xs text-white/70">Pose detection not available for close-up images</div>
                            </div>
                          </div>
                          <div className="px-4 py-2 bg-green-500 rounded-lg font-semibold text-sm shadow-lg">
                            Analysis Complete
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Health Assessment - Modern Design (All Types) */}
              {((result.analysis_type === 'sequential_validation' && result.combined_analysis) || result.injury_analysis) && (
                <div className="space-y-8">
                  {(result.combined_analysis?.health_assessment || result.injury_analysis) && (
                    <div>
                      <h3 className="text-2xl font-bold text-foreground mb-6">Health Assessment</h3>
                      
                      {/* Clean Status Card */}
                      <div className={`rounded-xl p-4 sm:p-6 shadow-lg border ${
                        (result.combined_analysis?.health_assessment === 'bumblefoot' || result.injury_analysis?.risk_level === 'high')
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900'
                          : 'bg-card border-border'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-start gap-3 sm:gap-4 flex-1">
                            {/* Icon */}
                            <div className={`p-2.5 sm:p-3 rounded-xl flex-shrink-0 ${
                              (result.combined_analysis?.health_assessment === 'bumblefoot' || result.injury_analysis?.risk_level === 'high')
                                ? 'bg-red-500'
                                : 'bg-primary'
                            }`}>
                              {(result.combined_analysis?.health_assessment === 'bumblefoot' || result.injury_analysis?.risk_level === 'high') ? 
                                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-white" /> :
                                <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                              }
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className={`inline-flex items-center gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold mb-2 ${
                                (result.combined_analysis?.health_assessment === 'bumblefoot' || result.injury_analysis?.risk_level === 'high')
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-100'
                                  : 'bg-primary/10 text-primary'
                              }`}>
                                {(result.combined_analysis?.health_assessment === 'bumblefoot' || result.injury_analysis?.risk_level === 'high') ? 'HIGH RISK' : 'LOW RISK'}
                              </div>
                              
                              <h4 className="text-lg sm:text-xl font-bold text-foreground mb-1">
                                {result.combined_analysis?.health_assessment === 'bumblefoot' ? 
                                  'Bumblefoot Detected' : 
                                  result.combined_analysis?.health_assessment === 'healthy' ?
                                  'Healthy Rooster' :
                                  result.combined_analysis?.health_assessment ?
                                  result.combined_analysis.health_assessment.split('_').map(word => 
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                  ).join(' ') :
                                  result.injury_analysis?.risk_level === 'low' ? 'Healthy Rooster' :
                                  result.injury_analysis?.detected_issues?.[0] || 'Health Assessment'
                                }
                              </h4>
                              
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {result.combined_analysis?.health_assessment === 'bumblefoot' ? 
                                  'Immediate veterinary attention recommended' : 
                                  result.combined_analysis?.health_assessment === 'healthy' ?
                                  'No significant health concerns identified' :
                                  result.injury_analysis?.risk_level === 'low' ?
                                  'No significant health concerns identified' :
                                  'Review recommendations below'}
                              </p>
                              
                              {/* Detected Issues Pills */}
                              {((result.combined_analysis?.specific_findings && result.combined_analysis.specific_findings.length > 0) || 
                                (result.injury_analysis?.detected_issues && result.injury_analysis.detected_issues.length > 0)) && (
                                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                                  {(result.combined_analysis?.specific_findings || result.injury_analysis?.detected_issues || []).map((finding: string, idx: number) => (
                                    <span key={idx} className="px-2 py-0.5 sm:py-1 bg-white dark:bg-slate-800 rounded-md text-xs font-medium text-red-600">
                                      {finding}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Confidence Score */}
                          {(result.combined_analysis?.combined_confidence || result.confidence) && (
                            <div className="text-center sm:text-right flex-shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l sm:pl-4">
                              <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                                {((result.combined_analysis?.combined_confidence || result.confidence || 0) * 100).toFixed(0)}%
                              </div>
                              <div className="text-xs text-muted-foreground">Confidence</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations - Grouped by Urgency */}
                  {((result.combined_analysis?.recommendations && result.combined_analysis.recommendations.length > 0) ||
                    (result.injury_analysis?.recommendations && result.injury_analysis.recommendations.length > 0)) && (
                    <div>
                      <h3 className="text-lg font-medium text-foreground mb-4">Recommendations</h3>
                      
                      <div className="space-y-4 mb-6">
                        {/* Immediate Actions - Modern Design */}
                        {(result.combined_analysis?.recommendations || result.injury_analysis?.recommendations || []).filter((rec: string) => 
                          rec.toLowerCase().includes('immediate') || 
                          rec.toLowerCase().includes('urgent') ||
                          rec.toLowerCase().includes('detected')
                        ).length > 0 && (
                          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              <h4 className="text-base font-semibold text-red-900 dark:text-red-100">Immediate Attention Required</h4>
                            </div>
                            <div className="space-y-2">
                              {(result.combined_analysis?.recommendations || result.injury_analysis?.recommendations || []).filter((rec: string) => 
                                rec.toLowerCase().includes('immediate') || 
                                rec.toLowerCase().includes('urgent') ||
                                rec.toLowerCase().includes('detected')
                              ).map((rec: string, index: number) => (
                                <div key={`immediate-${index}`} className="flex items-start gap-2 p-3 bg-white dark:bg-slate-800 rounded-md">
                                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                  <p className="text-sm text-slate-900 dark:text-white">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Monitor/Check Actions - Modern Design */}
                        {(result.combined_analysis?.recommendations || result.injury_analysis?.recommendations || []).filter((rec: string) => 
                          rec.toLowerCase().includes('check') || 
                          rec.toLowerCase().includes('monitor') ||
                          rec.toLowerCase().includes('examine') ||
                          rec.toLowerCase().includes('observe')
                        ).length > 0 && (
                          <div className="bg-card border border-border rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <Eye className="h-5 w-5 text-primary" />
                              <h4 className="text-base font-semibold text-foreground">Monitoring Required</h4>
                            </div>
                            <div className="space-y-2">
                              {(result.combined_analysis?.recommendations || result.injury_analysis?.recommendations || []).filter((rec: string) => 
                                rec.toLowerCase().includes('check') || 
                                rec.toLowerCase().includes('monitor') ||
                                rec.toLowerCase().includes('examine') ||
                                rec.toLowerCase().includes('observe')
                              ).map((rec: string, index: number) => (
                                <div key={`monitor-${index}`} className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                  <p className="text-sm text-foreground">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Follow-up Actions - Modern Design */}
                        {result.combined_analysis.recommendations.filter((rec: string) => 
                          rec.toLowerCase().includes('consult') || 
                          rec.toLowerCase().includes('veterinarian') ||
                          rec.toLowerCase().includes('restrict') ||
                          rec.toLowerCase().includes('continue')
                        ).length > 0 && (
                          <div className="bg-card border border-border rounded-lg p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <Stethoscope className="h-5 w-5 text-primary" />
                              <h4 className="text-base font-semibold text-foreground">Follow-up Care</h4>
                            </div>
                            <div className="space-y-2">
                              {(result.combined_analysis?.recommendations || result.injury_analysis?.recommendations || []).filter((rec: string) => 
                                rec.toLowerCase().includes('consult') || 
                                rec.toLowerCase().includes('veterinarian') ||
                                rec.toLowerCase().includes('restrict') ||
                                rec.toLowerCase().includes('continue')
                              ).map((rec: string, index: number) => (
                                <div key={`followup-${index}`} className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
                                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                  <p className="text-sm text-foreground">{rec}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* General Recommendations */}
                        {result.combined_analysis.recommendations.filter((rec: string) => 
                          !rec.toLowerCase().includes('immediate') && 
                          !rec.toLowerCase().includes('urgent') &&
                          !rec.toLowerCase().includes('detected') &&
                          !rec.toLowerCase().includes('check') && 
                          !rec.toLowerCase().includes('monitor') &&
                          !rec.toLowerCase().includes('examine') &&
                          !rec.toLowerCase().includes('observe') &&
                          !rec.toLowerCase().includes('consult') && 
                          !rec.toLowerCase().includes('veterinarian') &&
                          !rec.toLowerCase().includes('restrict') &&
                          !rec.toLowerCase().includes('continue')
                        ).length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 mb-3">
                              <Shield className="h-5 w-5 text-gray-600" />
                              <h4 className="font-semibold text-gray-600">General Recommendations</h4>
                            </div>
                            {result.combined_analysis.recommendations.filter((rec: string) => 
                              !rec.toLowerCase().includes('immediate') && 
                              !rec.toLowerCase().includes('urgent') &&
                              !rec.toLowerCase().includes('detected') &&
                              !rec.toLowerCase().includes('check') && 
                              !rec.toLowerCase().includes('monitor') &&
                              !rec.toLowerCase().includes('examine') &&
                              !rec.toLowerCase().includes('observe') &&
                              !rec.toLowerCase().includes('consult') && 
                              !rec.toLowerCase().includes('veterinarian') &&
                              !rec.toLowerCase().includes('restrict') &&
                              !rec.toLowerCase().includes('continue')
                            ).map((rec: string, index: number) => (
                              <div key={`general-${index}`} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                                </div>
                                <p className="text-sm leading-relaxed">{rec}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Treatment Guide - NEW! */}
                      {(() => {
                        const healthStatus = result.combined_analysis?.health_assessment || result.injury_analysis?.risk_level;
                        const treatmentGuide = getTreatmentGuide(healthStatus);
                        
                        if (!treatmentGuide) return null;
                        
                        return (
                          <div className="mb-6 border-2 border-primary/30 rounded-lg shadow-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {treatmentGuide.icon}
                                  <h4 className="text-base font-semibold text-foreground">{treatmentGuide.title}</h4>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setExpandedTreatment(!expandedTreatment)}
                                  className="flex items-center gap-1"
                                >
                                  {expandedTreatment ? (
                                    <>
                                      <ChevronUp className="h-4 w-4" />
                                      <span className="text-xs">Hide</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4" />
                                      <span className="text-xs">Show Steps</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Step-by-step treatment protocol and care instructions
                              </p>
                            </div>
                            
                            {expandedTreatment && (
                              <div className="p-4 space-y-4">
                                {treatmentGuide.steps.map((step, stepIndex) => (
                                  <div key={stepIndex} className="border-l-4 border-primary/30 pl-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                                        {step.icon}
                                      </div>
                                      <h5 className="text-sm font-semibold text-foreground">
                                        {stepIndex + 1}. {step.title}
                                      </h5>
                                    </div>
                                    <div className="space-y-1.5 ml-9">
                                      {step.actions.map((action, actionIndex) => (
                                        <div 
                                          key={actionIndex}
                                          className="flex items-start gap-2 p-2 bg-muted/30 rounded hover:bg-muted/50 transition-colors"
                                        >
                                          <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                          <p className="text-xs text-foreground leading-relaxed">{action}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      
                      {/* Actions */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          className="flex-1"
                          onClick={async () => {
                            try {
                              await handleSaveToDatabase();
                              toast.success('Analysis saved successfully!');
                            } catch (error) {
                              toast.error('Failed to save analysis');
                            }
                          }}
                        >
                          Save to Database
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            if (savedScanId) {
                              navigate(`/scan-results/${savedScanId}`);
                            }
                          }}
                          disabled={!savedScanId}
                        >
                          View Full Report
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Legacy fallback removed - now using modern design for all types */}
            </div>
          ) : (
            <div className="text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {result.error || 'Analysis failed'}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
