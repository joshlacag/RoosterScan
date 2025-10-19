import { Button } from "@/components/ui/button";
import { Camera, Activity, ScanLine, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
// Import types from shared API
type Rooster = {
  id: string;
  name: string;
  breed: string;
  gender: string;
  age: number;
  weight: number;
  color: string;
};
import { CameraManager } from "@/modules/camera/CameraManager";
import { RecordingManager } from "@/modules/camera/RecordingManager";

export default function Scan() {
  const [overlay, setOverlay] = useState(true);
  const [stats, setStats] = useState({ posture: "normal", wing: "normal", legs: "balanced", movement: "stable" });
  const [cameraOn, setCameraOn] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [scanStartTime, setScanStartTime] = useState<Date | null>(null);
  const [scanDuration, setScanDuration] = useState(0);
  const [scanPhase, setScanPhase] = useState<'analyzing' | 'optimal' | 'extended'>('analyzing');
  const [selectedRooster, setSelectedRooster] = useState<string>('');
  const [roosters, setRoosters] = useState<Rooster[]>([]);
  
  // Live pose analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [liveResults, setLiveResults] = useState<any>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<Date | null>(null);
  const [analysisInterval, setAnalysisInterval] = useState<NodeJS.Timeout | null>(null);
  
  const navigate = useNavigate();
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraManagerRef = useRef<CameraManager | null>(null);
  const recordingManagerRef = useRef<RecordingManager | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to capture frame and analyze with your YOLO models
  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        // Create FormData for API call
        const formData = new FormData();
        formData.append('image', blob, 'frame.jpg');
        
        try {
          // Call your existing pose detection API
          const response = await fetch('/api/pose/detect', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            setLiveResults(result);
            setFrameCount(prev => prev + 1);
            setLastAnalysisTime(new Date());
            
            // Update stats based on analysis results
            if (result.success && result.analysis_type === 'sequential_validation' && result.combined_analysis) {
              const health = result.combined_analysis.health_assessment;
              setStats(prev => ({
                ...prev,
                posture: health === 'healthy' ? 'normal' : 'abnormal',
                wing: health === 'healthy' ? 'normal' : 'abnormal',
                legs: health === 'bumblefoot' ? 'abnormal' : 'normal',
                movement: health === 'healthy' ? 'stable' : 'unstable'
              }));
            }
          }
        } catch (error) {
          console.error('Live analysis error:', error);
        }
      }, 'image/jpeg', 0.8);
      
    } catch (error) {
      console.error('Frame capture error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Load roosters on component mount
  useEffect(() => {
    const loadRoosters = async () => {
      try {
        const response = await api.getRoosters();
        if (response && Array.isArray(response)) {
          setRoosters(response as unknown as Rooster[]);
        }
      } catch (error) {
        console.error('Failed to load roosters:', error);
      }
    };
    loadRoosters();
  }, []);

  // Initialize camera and AI processing
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (cameraManagerRef.current) {
        cameraManagerRef.current.dispose();
      }
      if (recordingManagerRef.current) {
        recordingManagerRef.current.dispose();
      }
    };
  }, []);

  // Handle camera toggle
  const handleCameraToggle = async () => {
    if (cameraOn) {
      // Stop camera and live analysis
      try {
        // Stop live analysis interval
        if (analysisInterval) {
          clearInterval(analysisInterval);
          setAnalysisInterval(null);
        }
        
        if (cameraManagerRef.current) {
          await cameraManagerRef.current.stopStream();
        }
        if (recordingManagerRef.current) {
          await recordingManagerRef.current.stopRecording();
        }
        setCameraOn(false);
        setScanStartTime(null);
        setScanDuration(0);
        setScanPhase('analyzing');
        setLiveResults(null);
        setFrameCount(0);
        setIsAnalyzing(false);
        toast.success("Live scanning stopped");
      } catch (error) {
        toast.error("Failed to stop camera");
        console.error("Camera stop error:", error);
      }
    } else {
      // Start camera
      setIsInitializing(true);
      try {
        if (!cameraManagerRef.current) {
          cameraManagerRef.current = new CameraManager({
            width: 1280,
            height: 720,
            fps: 30,
            facingMode: 'environment'
          });
        }
        
        if (!recordingManagerRef.current) {
          recordingManagerRef.current = new RecordingManager();
        }

        if (videoRef.current) {
          const success = await cameraManagerRef.current.startStream(videoRef.current);
          if (success) {
            setCameraOn(true);
            setScanStartTime(new Date());
            
            // Start live analysis every 2 seconds
            const interval = setInterval(() => {
              captureAndAnalyzeFrame();
            }, 2000);
            setAnalysisInterval(interval);
            
            toast.success("Live scanning started");
          } else {
            toast.error("Failed to start camera");
          }
        }
      } catch (error) {
        toast.error("Failed to initialize camera");
        console.error("Camera initialization error:", error);
      } finally {
        setIsInitializing(false);
      }
    }
  };

  // Track scan duration and phases
  useEffect(() => {
    if (!cameraOn || !scanStartTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - scanStartTime.getTime();
      const seconds = Math.floor(elapsed / 1000);
      setScanDuration(seconds);

      // Update scan phases
      if (seconds < 5) {
        setScanPhase('analyzing');
      } else if (seconds <= 15) {
        setScanPhase('optimal');
        // Show optimal window notification once
        if (seconds === 5) {
          toast.info("Optimal scan window - ready to capture!", {
            duration: 3000,
          });
        }
      } else {
        setScanPhase('extended');
        // Show extended scan warning once
        if (seconds === 16) {
          toast.warning("Extended scan - consider capturing soon", {
            duration: 3000,
          });
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [cameraOn, scanStartTime]);

  // Simulate lightweight AI readings changing over time
  useEffect(() => {
    const id = setInterval(() => {
      if (!cameraOn) {
        setStats((s) => ({ ...s }));
      }
    }, 2000);
    return () => clearInterval(id);
  }, [cameraOn]);

  const capture = async () => {
    if (!cameraOn) {
      toast.error("Please start the camera first");
      return;
    }

    try {
      // Force an immediate analysis if we don't have recent results
      if (!liveResults || !lastAnalysisTime || (Date.now() - lastAnalysisTime.getTime()) > 5000) {
        toast.info("Capturing and analyzing frame...");
        await captureAndAnalyzeFrame();
        // Wait a moment for the analysis to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const duration = scanStartTime ? Math.floor((Date.now() - scanStartTime.getTime()) / 1000) : 0;
      
      // Use live analysis results if available
      const injuries = [];
      let severity = undefined;
      let healthAssessment = 'unknown';
      
      if (liveResults && liveResults.success && liveResults.combined_analysis) {
        healthAssessment = liveResults.combined_analysis.health_assessment;
        
        if (healthAssessment !== 'healthy') {
          injuries.push({
            type: healthAssessment,
            confidence: liveResults.combined_analysis.combined_confidence || 0,
            detected_at: new Date().toISOString()
          });
          
          severity = liveResults.combined_analysis.combined_confidence > 0.8 ? 'high' : 
                    liveResults.combined_analysis.combined_confidence > 0.6 ? 'medium' : 'low';
        }
      }
      
      const scanData = {
        roosterId: selectedRooster || null,
        results: { 
          ...stats,
          // Enhanced AI analysis data from your sequential validation
          health_assessment: healthAssessment,
          pose_confidence: liveResults?.pose_detection?.pose_confidence || liveResults?.confidence || 0,
          keypoints_detected: liveResults?.pose_detection?.keypoints_detected || liveResults?.keypoints?.length || 0,
          analysis_type: liveResults?.analysis_type || 'live_scan',
          
          // Additional rich data from your AI models
          combined_confidence: liveResults?.combined_analysis?.combined_confidence || liveResults?.pose_detection?.pose_confidence || 0,
          injury_classification: liveResults?.injury_classification,
          specific_findings: liveResults?.specific_findings || [],
          recommendations: liveResults?.recommendations || liveResults?.combined_analysis?.recommendations || [],
          
          // Technical metadata
          model_version: liveResults?.analysis_type === 'sequential_validation' ? 'YOLO-v8-Sequential-1.0' : 'YOLO-v8-Basic-1.0',
          processing_time_estimate: liveResults?.analysis_type === 'sequential_validation' ? 2500 : 1000,
          quality_gate_passed: liveResults?.pose_detection?.quality_gate_passed || false
        },
        overlay,
        injuries,
        severity,
        notes: `Live scan - ${frameCount} frames processed. Analysis: ${liveResults?.analysis_type || 'basic'}`,
        duration: duration
      };

      const newScan = await api.createScan(scanData);
      toast.success("Scan captured successfully!");
      
      // Navigate to detailed results page to show enhanced AI analysis
      navigate(`/scan-results/${newScan.id}`);
    } catch (error) {
      console.error('Failed to save scan:', error);
      toast.error('Failed to save scan');
    }
  };

  const [hasScans, setHasScans] = useState(false);

  // Check if user has scans in database
  useEffect(() => {
    const checkScans = async () => {
      try {
        const scans = await api.getScans();
        setHasScans(scans.length > 0);
      } catch (error) {
        console.error('Failed to check scans:', error);
        setHasScans(false);
      }
    };
    checkScans();
  }, []);

  const generateReport = async () => {
    try {
      const reportData = {
        scanId: '', // TODO: Get from latest scan
        title: 'Auto-generated Report',
        roosterId: selectedRooster || undefined,
        startDate: undefined,
        endDate: undefined
      };

      const newReport = await api.createReport(reportData);
      toast.success("Health report generated. View in History.");
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast.error("Failed to generate report");
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] items-start">
      <div>
        <div className="aspect-video rounded-xl border bg-black/90 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_60%)]" />
          
          {/* Video element for camera stream */}
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${cameraOn ? 'block' : 'hidden'}`}
            autoPlay
            playsInline
            muted
          />
          
          {/* Hidden canvas for frame capture */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Live Analysis Overlay */}
          {cameraOn && liveResults && (
            <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-white text-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Live Analysis</span>
              </div>
              <div className="space-y-1">
                <div>Frames: {frameCount}</div>
                {liveResults.success && liveResults.combined_analysis && (
                  <div className={`flex items-center gap-2 ${
                    liveResults.combined_analysis.health_assessment === 'healthy' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {liveResults.combined_analysis.health_assessment === 'healthy' ? 
                      <CheckCircle className="w-3 h-3" /> : 
                      <AlertTriangle className="w-3 h-3" />
                    }
                    <span className="capitalize">{liveResults.combined_analysis.health_assessment}</span>
                  </div>
                )}
                {isAnalyzing && (
                  <div className="text-blue-400 text-xs">Processing...</div>
                )}
              </div>
            </div>
          )}
          
          {/* Overlay content */}
          {!cameraOn && (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <div className="text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Click "Start Camera" to begin live analysis</p>
              </div>
            </div>
          )}
          
          {/* AR Overlay */}
          {overlay && cameraOn && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <ScanLine className="h-24 w-24 text-rose-400 animate-pulse" />
            </div>
          )}
          
          {/* Scan duration and phase indicator */}
          {cameraOn && (
            <div className="absolute top-4 left-4 bg-black/70 rounded-lg px-3 py-2 text-white text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  scanPhase === 'analyzing' ? 'bg-red-400 animate-pulse' :
                  scanPhase === 'optimal' ? 'bg-green-400' :
                  'bg-yellow-400'
                }`}></div>
                <span>
                  {scanPhase === 'analyzing' ? 'Analyzing...' :
                   scanPhase === 'optimal' ? 'Optimal Window' :
                   'Extended Scan'}
                </span>
                <span className="font-mono">{scanDuration}s</span>
              </div>
            </div>
          )}
          
          {/* Processing indicator */}
          {isInitializing && (
            <div className="absolute inset-0 bg-black/50 grid place-items-center">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                <p className="text-sm">Initializing camera and AI...</p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button 
            variant={cameraOn ? "destructive" : "default"} 
            onClick={handleCameraToggle}
            disabled={isInitializing}
          >
            <Camera className="mr-2" /> 
            {isInitializing ? "Initializing..." : cameraOn ? "Stop Camera" : "Start Camera"}
          </Button>
          <Button 
            onClick={capture} 
            variant={scanPhase === 'optimal' ? "default" : "gradient"}
            className={scanPhase === 'optimal' ? 'bg-green-600 hover:bg-green-700' : ''}
            disabled={!cameraOn}
          >
            <Camera className="mr-2" /> 
            {!cameraOn ? 'Start Camera First' : 
             scanPhase === 'optimal' ? 'Save Scan Results' : 'Capture & Save Scan'}
          </Button>

          <Button variant="outline" onClick={() => setOverlay((v) => !v)}>
            {overlay ? "Hide AR Overlay" : "Show AR Overlay"}
          </Button>
        </div>
      </div>
      <div className="rounded-xl border p-4 md:p-6 bg-card">
        <h2 className="text-xl font-semibold">Scan Settings</h2>
        
        {/* Rooster Selection */}
        <div className="mb-6">
          <label className="text-sm font-medium mb-2 block">Select Rooster</label>
          <select 
            value={selectedRooster} 
            onChange={(e) => setSelectedRooster(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            <option value="">Choose a rooster...</option>
            {roosters.map((rooster) => (
              <option key={rooster.id} value={rooster.id}>
                {rooster.name} ({rooster.breed})
              </option>
            ))}
          </select>
          {roosters.length === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              No roosters found. Add roosters in My Gamefowl first.
            </p>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2">Live AI Analysis</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time YOLO pose detection with sequential validation and injury classification.
        </p>
        
        {/* Live Analysis Status */}
        {cameraOn && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-sm font-medium">
                {isAnalyzing ? 'Analyzing...' : 'Ready'}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Frames processed: {frameCount}
              {lastAnalysisTime && (
                <span className="ml-2">
                  Last: {lastAnalysisTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Health Assessment Results */}
        {liveResults && liveResults.success && liveResults.combined_analysis ? (
          <div className="mt-4 space-y-3">
            <div className={`p-3 rounded-lg border ${
              liveResults.combined_analysis.health_assessment === 'healthy' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2">
                {liveResults.combined_analysis.health_assessment === 'healthy' ? 
                  <CheckCircle className="w-4 h-4 text-green-600" /> : 
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                }
                <span className="font-medium capitalize">
                  {liveResults.combined_analysis.health_assessment}
                </span>
                {liveResults.combined_analysis.combined_confidence && (
                  <span className="text-sm text-muted-foreground">
                    ({(liveResults.combined_analysis.combined_confidence * 100).toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
            
            {/* Technical Metrics */}
            {liveResults.pose_detection && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Keypoints: {liveResults.pose_detection.keypoints_detected}/17</div>
                <div>Pose confidence: {(liveResults.pose_detection.pose_confidence * 100).toFixed(1)}%</div>
                <div>Quality gate: {liveResults.pose_detection.quality_gate_passed ? 'PASSED' : 'FAILED'}</div>
              </div>
            )}
          </div>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            <li>• Posture: {stats.posture}</li>
            <li>• Wing: {stats.wing}</li>
            <li>• Legs: {stats.legs}</li>
            <li>• Movement: {stats.movement}</li>
          </ul>
        )}
        <div className="mt-6 grid gap-3">
          <Button variant="secondary" className="w-full" onClick={generateReport} disabled={!hasScans}>
            <Activity className="mr-2" /> Generate Health Report
          </Button>
          {hasScans && (
            <a href="/history" className="text-sm text-primary underline underline-offset-4">Open Scan History</a>
          )}
        </div>
      </div>
    </div>
  );
}
