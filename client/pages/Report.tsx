import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { Scan, Rooster } from "@shared/api";
import { toast } from "sonner";
import { 
  FileText, 
  Calendar, 
  User, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Printer,
  Share2
} from "lucide-react";

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [scan, setScan] = useState<Scan | null>(null);
  const [roosters, setRoosters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // All hooks must be called before any early returns
  const roosterName = useMemo(() => {
    if (!scan?.roosterId) return "Unassigned";
    return roosters[scan.roosterId] || "Unknown";
  }, [scan, roosters]);

  const healthStatus = useMemo(() => {
    if (!scan?.injuries || scan.injuries.length === 0) return "healthy";
    return scan.severity === "high" ? "critical" : scan.severity === "medium" ? "moderate" : "mild";
  }, [scan?.injuries, scan?.severity]);

  useEffect(() => {
    loadReportData();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadReportData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Load scan and roosters in parallel
      const [scanData, roostersData] = await Promise.all([
        api.getScans().then(scans => scans.find(s => s.id === id) || null),
        api.getRoosters()
      ]);
      
      setScan(scanData);
      
      // Create rooster name mapping
      const roosterMap: Record<string, string> = {};
      roostersData.forEach((r: Rooster) => (roosterMap[r.id] = r.name));
      setRoosters(roosterMap);
      
    } catch (error) {
      console.error('Failed to load report data:', error);
      toast.error('Failed to load report data');
      setScan(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border p-10 text-center">
        <p className="mb-4">Loading report...</p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="rounded-xl border p-10 text-center">
        <p className="mb-4">Report not found.</p>
        <Button asChild>
          <Link to="/pose">Start New Scan</Link>
        </Button>
      </div>
    );
  }

  const getHealthIcon = () => {
    switch (healthStatus) {
      case "critical": return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "moderate": return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "mild": return <Activity className="h-5 w-5 text-blue-500" />;
      default: return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getHealthColor = () => {
    switch (healthStatus) {
      case "critical": return "text-red-600 bg-red-50 border-red-200";
      case "moderate": return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "mild": return "text-blue-600 bg-blue-50 border-blue-200";
      default: return "text-green-600 bg-green-50 border-green-200";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-4 sm:flex sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Health Assessment Report</h1>
            <p className="text-muted-foreground">AI-Powered Rooster Health Analysis</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Report Summary Card */}
      <Card className={`border-2 ${getHealthColor()}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getHealthIcon()}
              <div>
                <CardTitle className="text-xl capitalize">{healthStatus} Status</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {scan.injuries && scan.injuries.length > 0 
                    ? `${scan.injuries.length} issue(s) detected`
                    : "No health issues detected"
                  }
                </p>
              </div>
            </div>
            <Badge 
              variant={scan.analysisConfidence && scan.analysisConfidence > 0.8 ? "default" : "secondary"}
              className="text-sm"
            >
              {scan.analysisConfidence ? `${(scan.analysisConfidence * 100).toFixed(1)}% Confidence` : "Analyzed"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Report Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Subject Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Subject Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Rooster ID</label>
                <p className="font-medium">{roosterName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Scan Type</label>
                <p className="font-medium">Pose Analysis</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Scan Date</label>
                <p className="font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(scan.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Scan Time</label>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {new Date(scan.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Processing Time</label>
                <p className="font-medium">{scan.duration || 0}s</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Model Version</label>
                <p className="font-medium">{scan.modelVersion || "YOLO-v8"}</p>
              </div>
            </div>
            <Separator />
            <div>
              <label className="text-sm font-medium text-muted-foreground">Keypoints Detected</label>
              <p className="font-medium">{scan.notes?.match(/(\d+) keypoints/)?.[1] || "17"} anatomical points</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health Assessment */}
      {scan.injuries && scan.injuries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Health Issues Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scan.injuries.map((injury: string, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="font-medium capitalize">{injury.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">Requires veterinary attention</p>
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {scan.severity === "high" ? "High Priority" : scan.severity === "medium" ? "Medium Priority" : "Monitor"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scan.injuries && scan.injuries.length > 0 ? (
              <>
                <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800">Immediate Veterinary Consultation Required</p>
                    <p className="text-sm text-red-600">Schedule an appointment with a qualified veterinarian for proper diagnosis and treatment.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Activity className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Monitor Closely</p>
                    <p className="text-sm text-yellow-600">Keep the rooster under observation and limit physical activity until professional assessment.</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-green-800">Healthy Status Confirmed</p>
                  <p className="text-sm text-green-600">Continue regular monitoring and maintain current care routine. Schedule routine check-ups as recommended.</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/pose">
              <Activity className="h-4 w-4 mr-2" />
              New Analysis
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/history">
              <FileText className="h-4 w-4 mr-2" />
              View History
            </Link>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Report ID: {scan.id.substring(0, 8)}...
        </p>
      </div>
    </div>
  );
}
