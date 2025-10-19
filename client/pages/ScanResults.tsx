import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Target, 
  Brain, 
  Activity,
  ArrowLeft,
  AlertCircle,
  TrendingUp,
  Eye,
  Sparkles,
  Stethoscope,
  Search,
  FileText,
  Zap,
  Shield,
  ChevronDown,
  ChevronUp,
  Pill,
  Syringe,
  Heart,
  Home
} from "lucide-react";
import { api } from "@/lib/api";
import { Scan } from "@shared/api";
import { toast } from "sonner";

export default function ScanResults() {
  const { scanId } = useParams<{ scanId: string }>();
  const navigate = useNavigate();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTreatment, setExpandedTreatment] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (scanId) {
      loadScan(scanId);
    }
  }, [scanId]);

  const loadScan = async (id: string) => {
    try {
      setLoading(true);
      const scanData = await api.getScan(id);
      setScan(scanData);
      
      const imageUrl = scanData.poseData?.imageUrl;
      const keypoints = scanData.poseData?.keypoints;
      
      console.log('Scan data loaded:', {
        hasImageUrl: !!imageUrl,
        hasKeypoints: !!keypoints,
        keypointsCount: keypoints?.length || 0,
        poseData: scanData.poseData
      });
      
      // Draw keypoints on canvas if image and keypoints exist
      if (imageUrl && keypoints) {
        setTimeout(() => drawKeypointsOnImage(imageUrl, keypoints), 100);
      } else {
        console.warn('Missing data for visualization:', {
          hasImageUrl: !!imageUrl,
          hasKeypoints: !!keypoints
        });
      }
    } catch (error) {
      console.error('Failed to load scan:', error);
      toast.error('Failed to load scan results');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  };

  const drawKeypointsOnImage = (imageUrl: string, keypoints: any[]) => {
    console.log('Drawing keypoints:', keypoints.length, 'keypoints');
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

    const img = new Image();
    img.onload = () => {
      console.log('Image loaded successfully');
      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Calculate scaling
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      // Draw image
      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Draw skeleton connections
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.3)';
      ctx.lineWidth = 2;
      const connections = [
        [0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [5, 6],
        [3, 7], [7, 8], [8, 9], [3, 10], [10, 11], [11, 12],
        [4, 13], [13, 14], [4, 15], [15, 16]
      ];

      connections.forEach(([start, end]) => {
        if (keypoints[start] && keypoints[end] && 
            keypoints[start].confidence > 0.5 && keypoints[end].confidence > 0.5) {
          ctx.beginPath();
          ctx.moveTo(keypoints[start].x * scale + offsetX, keypoints[start].y * scale + offsetY);
          ctx.lineTo(keypoints[end].x * scale + offsetX, keypoints[end].y * scale + offsetY);
          ctx.stroke();
        }
      });

      // Draw keypoints
      keypoints.forEach((kp) => {
        if (kp && kp.confidence > 0.5) {
          const x = kp.x * scale + offsetX;
          const y = kp.y * scale + offsetY;

          // Outer glow
          const gradient = ctx.createRadialGradient(x, y, 0, x, y, 12);
          gradient.addColorStop(0, 'rgba(244, 63, 94, 0.9)');
          gradient.addColorStop(1, 'rgba(244, 63, 94, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, 12, 0, Math.PI * 2);
          ctx.fill();

          // Keypoint dot
          ctx.fillStyle = 'rgba(244, 63, 94, 1)';
          ctx.beginPath();
          ctx.arc(x, y, 6, 0, Math.PI * 2);
          ctx.fill();

          // Label
          if (kp.name) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.font = '12px system-ui';
            ctx.textAlign = 'center';
            ctx.fillText(kp.name, x, y - 15);
          }
        }
      });
    };

    img.src = imageUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scan results...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Scan Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested scan could not be found.</p>
        <Button onClick={() => navigate('/history')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to History
        </Button>
      </div>
    );
  }

  const poseData = scan.poseData || {};
  const healthStatus = poseData.health_assessment || 'unknown';
  const confidence = scan.analysisConfidence || 0;
  
  // Ensure recommendations is an array of strings
  let recommendations = [];
  if (Array.isArray(poseData.recommendations)) {
    recommendations = poseData.recommendations.map((rec: any) => 
      typeof rec === 'string' ? rec : (rec?.text || rec?.message || String(rec))
    );
  }

  const getHealthStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'bg-primary/10 text-primary border-primary/20';
      case 'bumblefoot': return 'bg-red-100 text-red-800 border-red-200';
      case 'injured': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTreatmentGuide = (status: string) => {
    switch (status.toLowerCase()) {
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

  const treatmentGuide = getTreatmentGuide(healthStatus);

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* Back Button */}
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={() => navigate('/history')}
        className="mb-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to History
      </Button>

      {/* Header with Status Badge */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4 sm:p-6 md:p-8">
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Analysis Complete</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(scan.createdAt).toLocaleDateString()} at{' '}
                      {new Date(scan.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Quick Status */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-4">
                <Badge className={`${getHealthStatusColor(healthStatus)} text-sm sm:text-base font-semibold px-3 sm:px-4 py-1.5 border w-fit`}>
                  {healthStatus === 'healthy' && <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />}
                  {healthStatus !== 'healthy' && <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />}
                  {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
                </Badge>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                  <span className="font-semibold text-primary">{Math.round(confidence * 100)}%</span>
                  <span className="text-muted-foreground">confidence</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pose Visualization Card */}
      <Card className="border-2 border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Pose Analysis Visualization
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            17-point anatomical keypoint detection completed
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          {poseData.imageUrl && poseData.keypoints && Array.isArray(poseData.keypoints) && poseData.keypoints.length > 0 ? (
            <div className="w-full bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border-2 border-primary/20 relative overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-auto"></canvas>
              <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span>{typeof poseData.keypoints_detected === 'number' ? poseData.keypoints_detected : 0}/17 keypoints</span>
                <span className="text-white/60">•</span>
                <TrendingUp className="h-4 w-4" />
                <span>{Math.round((typeof poseData.pose_confidence === 'number' ? poseData.pose_confidence : 0) * 100)}% confidence</span>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg border-2 border-dashed border-primary/20 flex items-center justify-center">
              <div className="text-center p-6">
                <Target className="h-16 w-16 text-primary/40 mx-auto mb-4" />
                <p className="text-lg font-semibold text-foreground mb-2">
                  Pose Detection Completed
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  {typeof poseData.keypoints_detected === 'number' ? poseData.keypoints_detected : 0} of 17 keypoints detected with {Math.round((typeof poseData.pose_confidence === 'number' ? poseData.pose_confidence : 0) * 100)}% confidence
                </p>
                <p className="text-xs text-muted-foreground">
                  Keypoint visualization available for new scans
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Status Card */}
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <Badge className={`${getHealthStatusColor(healthStatus)} text-xs font-semibold px-2 py-1 border`}>
                {healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1)}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mb-1">Overall Status</div>
            <div className="text-2xl font-bold">
              {healthStatus === 'healthy' ? 'Healthy' : 'Attention Needed'}
            </div>
          </CardContent>
        </Card>

        {/* Confidence Card */}
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {confidence > 0.8 ? 'High' : confidence > 0.6 ? 'Medium' : 'Low'}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mb-1">AI Confidence</div>
            <div className="text-2xl font-bold text-primary">{Math.round(confidence * 100)}%</div>
            <Progress value={confidence * 100} className="h-2 mt-3" />
          </CardContent>
        </Card>

        {/* Quality Card */}
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-primary" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {typeof poseData.keypoints_detected === 'number' ? poseData.keypoints_detected : 0}/17
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mb-1">Analysis Quality</div>
            <div className="text-2xl font-bold">
              {confidence > 0.8 ? 'Excellent' : confidence > 0.6 ? 'Good' : 'Fair'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations Section - Grouped by Urgency */}
      {recommendations.length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" />
              <span>AI Recommendations</span>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Professional care suggestions based on analysis
            </p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Immediate Actions */}
              {recommendations.filter((rec: string) => 
                rec.toLowerCase().includes('immediate') || 
                rec.toLowerCase().includes('urgent') ||
                rec.toLowerCase().includes('detected')
              ).length > 0 && (
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h3 className="text-base font-semibold text-red-900 dark:text-red-100">Immediate Attention Required</h3>
                  </div>
                  <div className="space-y-2">
                    {recommendations.filter((rec: string) => 
                      rec.toLowerCase().includes('immediate') || 
                      rec.toLowerCase().includes('urgent') ||
                      rec.toLowerCase().includes('detected')
                    ).map((rec: string, index: number) => (
                      <div 
                        key={`immediate-${index}`}
                        className="flex items-start gap-2 p-3 bg-white dark:bg-slate-800 rounded-md"
                      >
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-slate-900 dark:text-white">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Monitor/Check Actions */}
              {recommendations.filter((rec: string) => 
                rec.toLowerCase().includes('check') || 
                rec.toLowerCase().includes('monitor') ||
                rec.toLowerCase().includes('examine') ||
                rec.toLowerCase().includes('observe')
              ).length > 0 && (
                <div className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Monitoring Required</h3>
                  </div>
                  <div className="space-y-2">
                    {recommendations.filter((rec: string) => 
                      rec.toLowerCase().includes('check') || 
                      rec.toLowerCase().includes('monitor') ||
                      rec.toLowerCase().includes('examine') ||
                      rec.toLowerCase().includes('observe')
                    ).map((rec: string, index: number) => (
                      <div 
                        key={`monitor-${index}`}
                        className="flex items-start gap-2 p-3 bg-muted/50 rounded-md"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <p className="text-sm text-foreground">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up Actions */}
              {recommendations.filter((rec: string) => 
                rec.toLowerCase().includes('consult') || 
                rec.toLowerCase().includes('veterinarian') ||
                rec.toLowerCase().includes('restrict') ||
                rec.toLowerCase().includes('continue')
              ).length > 0 && (
                <div className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">Follow-up Care</h3>
                  </div>
                  <div className="space-y-2">
                    {recommendations.filter((rec: string) => 
                      rec.toLowerCase().includes('consult') || 
                      rec.toLowerCase().includes('veterinarian') ||
                      rec.toLowerCase().includes('restrict') ||
                      rec.toLowerCase().includes('continue')
                    ).map((rec: string, index: number) => (
                      <div 
                        key={`followup-${index}`}
                        className="flex items-start gap-2 p-3 bg-muted/50 rounded-md"
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        <p className="text-sm text-foreground">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uncategorized Recommendations */}
              {recommendations.filter((rec: string) => 
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
                <div className="bg-card border border-border rounded-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">General Recommendations</h3>
                  </div>
                  <div className="space-y-2">
                    {recommendations.filter((rec: string) => 
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
                      <div 
                        key={`general-${index}`}
                        className="flex items-start gap-2 p-3 bg-muted/50 rounded-md"
                      >
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-bold text-primary">{index + 1}</span>
                        </div>
                        <p className="text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Treatment Guide - NEW! */}
      {treatmentGuide && (
        <Card className="border-2 border-primary/30 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                {treatmentGuide.icon}
                <span>{treatmentGuide.title}</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedTreatment(!expandedTreatment)}
                className="flex items-center gap-1"
              >
                {expandedTreatment ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    <span className="text-sm">Hide Details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    <span className="text-sm">Show Treatment Steps</span>
                  </>
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Step-by-step treatment protocol and care instructions
            </p>
          </CardHeader>
          
          {expandedTreatment && (
            <CardContent className="pt-6">
              <div className="space-y-6">
                {treatmentGuide.steps.map((step, stepIndex) => (
                  <div key={stepIndex} className="border-l-4 border-primary/30 pl-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        {step.icon}
                      </div>
                      <h3 className="text-base font-semibold text-foreground">
                        {stepIndex + 1}. {step.title}
                      </h3>
                    </div>
                    <div className="space-y-2 ml-10">
                      {step.actions.map((action, actionIndex) => (
                        <div 
                          key={actionIndex}
                          className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                          <p className="text-sm text-foreground leading-relaxed">{action}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                      Important Disclaimer
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      This AI analysis is a screening tool, not a definitive diagnosis. Always consult with a qualified avian veterinarian for proper diagnosis and treatment. In case of severe injuries or emergencies, seek professional veterinary care immediately.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Technical Analysis - Enhanced */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Pose Detection Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              17-point anatomical keypoint detection
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Keypoints Detected</div>
                <div className="text-2xl font-bold">
                  {typeof poseData.keypoints_detected === 'number' ? poseData.keypoints_detected : 0}
                  <span className="text-sm text-muted-foreground font-normal">/17</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground mb-1">Detection Rate</div>
                <div className="text-lg font-semibold text-primary">
                  {Math.round(((typeof poseData.keypoints_detected === 'number' ? poseData.keypoints_detected : 0) / 17) * 100)}%
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pose Confidence</span>
                <span className="font-semibold">
                  {Math.round((typeof poseData.pose_confidence === 'number' ? poseData.pose_confidence : 0) * 100)}%
                </span>
              </div>
              <Progress 
                value={(typeof poseData.pose_confidence === 'number' ? poseData.pose_confidence : 0) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Quality Gate Status</span>
              <Badge variant={poseData.quality_gate_passed ? "default" : "secondary"} className="text-sm">
                {poseData.quality_gate_passed ? "✓ Passed" : "✗ Failed"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Model Information
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Sequential validation framework
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="text-xs text-muted-foreground mb-1">Analysis Method</div>
              <Badge variant="outline" className="text-sm font-semibold">
                {poseData.analysis_type === 'sequential_validation' ? '🔬 Sequential Validation' : '📊 Basic Analysis'}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Model Version</span>
                <span className="text-sm font-mono font-semibold">{scan.modelVersion || 'v1.0'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Processing Time</span>
                <span className="text-sm font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  {scan.processingTimeMs || 0}ms
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Analysis Date</span>
                <span className="text-sm font-semibold">
                  {new Date(scan.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Injury Classifications */}
      {scan.injuryDetections && scan.injuryDetections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Detailed Classifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scan.injuryDetections.map((detection: any, index: number) => {
                // Handle confidence being either a number or an object
                const confidenceValue = typeof detection.confidence === 'number' 
                  ? detection.confidence 
                  : (detection.confidence?.confidence || 0);
                
                return (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{detection.type}</span>
                      <Badge variant="outline">
                        {Math.round(confidenceValue * 100)}% confidence
                      </Badge>
                    </div>
                    {detection.classification_data && (
                      <div className="text-sm text-muted-foreground">
                        <div>Classification: {detection.classification_data.classification}</div>
                        {detection.classification_data.probabilities && (
                          <div className="mt-1">
                            Probabilities: {Object.entries(detection.classification_data.probabilities)
                              .map(([key, value]: [string, any]) => `${key}: ${Math.round(value * 100)}%`)
                              .join(', ')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-4 pt-6">
        <Button onClick={() => navigate('/history')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          View All Scans
        </Button>
        <Button onClick={() => navigate('/pose')}>
          Analyze Another Rooster
        </Button>
        <Link to={`/reports/create?scanId=${scan.id}`}>
          <Button variant="outline">
            Generate Report
          </Button>
        </Link>
      </div>
    </div>
  );
}
