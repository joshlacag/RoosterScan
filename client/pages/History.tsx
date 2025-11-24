import { useEffect, useMemo, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FolderOpen, Calendar, Clock, Activity, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Scan, HealthReport, Rooster } from "@shared/api";
import { toast } from "sonner";

export default function History() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [roosters, setRoosters] = useState<Record<string, string>>({});
  const [roostersData, setRoostersData] = useState<Rooster[]>([]);
  const [selectedRoosterId, setSelectedRoosterId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load scans, reports, and roosters from API
      const [scansData, reportsData, roostersData] = await Promise.all([
        api.getScans(),
        api.getReports(),
        api.getRoosters()
      ]);
      
      setScans(scansData);
      setReports(reportsData);
      setRoostersData(roostersData);
      
      // Create rooster name mapping
      const roosterMap: Record<string, string> = {};
      roostersData.forEach((r: Rooster) => (roosterMap[r.id] = r.name));
      setRoosters(roosterMap);
      
    } catch (error) {
      console.error('Failed to load history data:', error);
      toast.error('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    // Filter scans by selected rooster if any
    const filteredScans = selectedRoosterId 
      ? scans.filter(scan => scan.roosterId === selectedRoosterId)
      : scans;
    // Create CSV headers
    const headers = [
      'Rooster Name',
      'Scan Date',
      'Health Status',
      'Confidence Score',
      'Keypoints Detected',
      'Key Findings',
      'Recommendations',
      'Scan Type'
    ];

    // Convert filtered scan data to CSV rows
    const csvRows = filteredScans.map(scan => {
      const scanDate = new Date(scan.createdAt).toLocaleDateString();
      const roosterName = roosters[scan.roosterId] || 'General Scan';
      
      // Extract health info from available scan data
      let healthStatus = 'Healthy'; // Default to healthy if no issues detected
      let confidence = scan.analysisConfidence ? `${(scan.analysisConfidence * 100).toFixed(1)}%` : '0%';
      let keypoints = '0';
      let findings = 'No specific issues detected';
      let recommendations = 'Continue regular monitoring';

      // Only change status if there are actual injuries detected
      if (scan.injuries && scan.injuries.length > 0) {
        healthStatus = 'Injured';
        findings = scan.injuries.join('; ');
        recommendations = 'Consult veterinarian for proper treatment';
        
        // Apply severity only when there are actual injuries
        if (scan.severity === 'high') {
          healthStatus = 'High Risk Injury';
        } else if (scan.severity === 'medium') {
          healthStatus = 'Medium Risk Injury';
        }
      }

      // If we have processing time, we can infer it was analyzed
      if (scan.processingTimeMs && scan.processingTimeMs > 0) {
        keypoints = '15+'; // Estimated based on successful analysis
      }

      // Clean up text for CSV (remove commas and newlines)
      const cleanText = (text: string) => text.replace(/,/g, ';').replace(/\n/g, ' ').trim();

      return [
        cleanText(roosterName),
        scanDate,
        cleanText(healthStatus),
        confidence,
        keypoints,
        cleanText(findings),
        cleanText(recommendations),
        scan.scanType === 'live_video' ? 'Pose Analysis' : (scan.scanType || 'Pose Analysis')
      ];
    });

    // Combine headers and data
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Generate filename based on filter
    const selectedRoosterName = selectedRoosterId ? roosters[selectedRoosterId] : null;
    const filename = selectedRoosterName 
      ? `RoosterScan-${selectedRoosterName.replace(/[^a-zA-Z0-9]/g, '')}-Report-${new Date().toISOString().split('T')[0]}.csv`
      : `RoosterScan-Health-Report-${new Date().toISOString().split('T')[0]}.csv`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    const exportMessage = selectedRoosterName 
      ? `${selectedRoosterName} health report exported successfully!`
      : 'Health report exported successfully!';
    toast.success(exportMessage);
  };

  const empty = useMemo(() => scans.length === 0, [scans]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Scan History</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Review past captures and export your data.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Rooster Filter */}
          <div className="flex items-center gap-2">
            <label htmlFor="rooster-filter" className="text-sm font-medium whitespace-nowrap">
              Filter by:
            </label>
            <select
              id="rooster-filter"
              value={selectedRoosterId}
              onChange={(e) => setSelectedRoosterId(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Roosters</option>
              {roostersData.map((rooster) => (
                <option key={rooster.id} value={rooster.id}>
                  {rooster.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex gap-2">
              <Button 
                onClick={loadData} 
                variant="outline" 
                size="sm"
                disabled={loading}
                className="flex-1 sm:flex-none"
              >
                <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> 
                <span className="hidden sm:inline">Refresh</span>
                <span className="sm:hidden">Refresh</span>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Link to="/pose">
                  <FolderOpen className="mr-1 h-4 w-4" /> 
                  <span className="hidden sm:inline">Analyze Rooster</span>
                  <span className="sm:hidden">Analyze</span>
                </Link>
              </Button>
            </div>
            <Button onClick={exportCsv} size="sm" className="w-full sm:w-auto">
              <Download className="mr-1 h-4 w-4" /> 
              <span className="hidden sm:inline">
                Export {selectedRoosterId ? roosters[selectedRoosterId] : 'All'} Report
              </span>
              <span className="sm:hidden">
                Export {selectedRoosterId ? 'Selected' : 'All'}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {reports.length > 0 && (
        <div className="grid gap-4">
          <h2 className="text-base sm:text-lg font-semibold">Health Reports</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-base">{r.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleString()}</p>
                </CardHeader>
                <CardContent className="text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-muted-foreground">Rooster</div>
                      <div className="font-medium">{roosters[r.roosterId] || "Unknown"}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <Badge variant={r.status === 'final' ? 'default' : 'secondary'}>{r.status}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2">
                    <div>
                      <div className="text-muted-foreground">Health Scores</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.overallHealthScore && (
                          <Badge variant="secondary">Overall: {r.overallHealthScore}%</Badge>
                        )}
                        {r.mobilityScore && (
                          <Badge variant="secondary">Mobility: {r.mobilityScore}%</Badge>
                        )}
                        {r.postureScore && (
                          <Badge variant="secondary">Posture: {r.postureScore}%</Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Injuries</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge variant={r.totalInjuriesDetected > 0 ? "destructive" : "secondary"}>
                          Total: {r.totalInjuriesDetected}
                        </Badge>
                        {r.highPriorityInjuries > 0 && (
                          <Badge variant="destructive">High Priority: {r.highPriorityInjuries}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {r.summary && (
                    <div className="mt-3">
                      <div className="text-muted-foreground">Summary</div>
                      <p className="text-xs mt-1">{r.summary}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {empty ? (
        <div className="rounded-xl border p-10 text-center text-muted-foreground">
          No scans yet. <Link to="/pose" className="text-primary underline underline-offset-4">Start your first analysis</Link>.
        </div>
      ) : loading ? (
        <>
          {/* Mobile Skeleton */}
          <div className="block md:hidden space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <div className="pt-2 border-t">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Desktop Skeleton */}
          <div className="hidden md:block rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Rooster</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Injuries Detected</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="block md:hidden space-y-3">
            {scans.map((scan, index) => (
              <Card key={scan.id} className="overflow-hidden stagger-item">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(scan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <Badge variant={
                      scan.status === 'completed' ? 'default' : 
                      scan.status === 'failed' ? 'destructive' : 
                      'secondary'
                    }>
                      {scan.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{new Date(scan.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {scan.roosterId ? roosters[scan.roosterId] || "Unknown" : "Unassigned"}
                      </span>
                    </div>
                    
                    {scan.analysisConfidence && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Confidence</span>
                        <span className="text-sm font-semibold">{Math.round(scan.analysisConfidence * 100)}%</span>
                      </div>
                    )}
                    
                    {scan.injuryDetections && Array.isArray(scan.injuryDetections) && scan.injuryDetections.length > 0 && (
                      <div className="pt-2 border-t">
                        <span className="text-xs text-muted-foreground mb-2 block">Injuries Detected</span>
                        <div className="flex flex-wrap gap-1">
                          {scan.injuryDetections.map((inj: any, idx: number) => {
                            let injuryType = 'Unknown';
                            
                            if (typeof inj === 'string') {
                              injuryType = inj;
                            } else if (typeof inj.type === 'string') {
                              injuryType = inj.type;
                            } else if (inj.type?.name) {
                              injuryType = inj.type.name;
                            }
                            
                            injuryType = injuryType
                              .replace(/_/g, ' ')
                              .replace(/classification\.result/g, '')
                              .trim();
                            
                            if (!injuryType || injuryType === 'Unknown' || injuryType.length < 2) {
                              return null;
                            }
                            
                            return (
                              <Badge key={idx} variant={
                                inj.severity === 'severe' ? 'destructive' : 
                                inj.severity === 'moderate' ? 'default' : 
                                'secondary'
                              } className="text-xs">
                                {injuryType.charAt(0).toUpperCase() + injuryType.slice(1)}
                              </Badge>
                            );
                          }).filter(Boolean)}
                        </div>
                      </div>
                    )}
                    
                    {scan.notes && (
                      <div className="pt-2 border-t">
                        <span className="text-xs text-muted-foreground">Notes</span>
                        <p className="text-sm mt-1">{scan.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block rounded-xl border overflow-x-auto">
            <div className="min-w-[800px]">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Rooster</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Injuries Detected</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scans.map((scan) => (
                <TableRow key={scan.id}>
                  <TableCell>{new Date(scan.createdAt).toLocaleString()}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {scan.roosterId ? roosters[scan.roosterId] || "Unknown" : "Unassigned"}
                  </TableCell>
                  <TableCell>
                    {scan.duration && scan.duration > 0 ? `${scan.duration}s` : 
                     scan.scanType === 'live_video' || scan.scanType === 'recorded_video' ? "—" : 
                     "Instant"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      scan.status === 'completed' ? 'default' : 
                      scan.status === 'failed' ? 'destructive' : 
                      'secondary'
                    }>
                      {scan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="min-w-[160px]">
                    <div className="flex flex-wrap gap-1">
                      {scan.injuryDetections && Array.isArray(scan.injuryDetections) && scan.injuryDetections.length > 0 ? (
                        scan.injuryDetections.map((inj: any, idx: number) => {
                          // Handle different injury data formats
                          let injuryType = 'Unknown';
                          
                          if (typeof inj === 'string') {
                            injuryType = inj;
                          } else if (typeof inj.type === 'string') {
                            injuryType = inj.type;
                          } else if (inj.type?.name) {
                            injuryType = inj.type.name;
                          }
                          
                          // Clean up the display text
                          injuryType = injuryType
                            .replace(/_/g, ' ')
                            .replace(/classification\.result/g, '')
                            .trim();
                          
                          // Skip if empty or just "Unknown"
                          if (!injuryType || injuryType === 'Unknown' || injuryType.length < 2) {
                            return null;
                          }
                          
                          return (
                            <Badge key={idx} variant={
                              inj.severity === 'severe' ? 'destructive' : 
                              inj.severity === 'moderate' ? 'default' : 
                              'secondary'
                            }>
                              {injuryType.charAt(0).toUpperCase() + injuryType.slice(1)}
                            </Badge>
                          );
                        }).filter(Boolean) // Remove null entries
                      ) : (
                        <span className="text-sm text-muted-foreground">None detected</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {scan.analysisConfidence ? `${Math.round(scan.analysisConfidence * 100)}%` : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {scan.notes || "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}
