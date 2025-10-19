import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Bird, Camera, GraduationCap, History, Activity } from "lucide-react";
import RoosterPoseVisualization from "@/components/RoosterPoseVisualization";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Scan } from "@shared/api";

export default function Index() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScans();
  }, []);

  const loadScans = async () => {
    try {
      const scansData = await api.getScans();
      setScans(scansData);
    } catch (error) {
      console.error('Failed to load scans:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats from scans
  const abnormalitiesCount = scans.filter(scan => 
    scan.injuryDetections && scan.injuryDetections.length > 0
  ).length;

  const lastScan = scans.length > 0 
    ? new Date(scans[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  const totalScans = scans.length;

  return (
    <div className="space-y-8 md:space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl md:rounded-3xl border bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/40 dark:to-amber-900/20 fade-in">
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none [mask-image:radial-gradient(60%_60%_at_50%_0%,#000_60%,transparent_100%)]">
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(244,63,94,0.35),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(245,158,11,0.35),transparent_40%)]" />
        </div>
        <div className="p-4 sm:p-6 md:p-12 grid md:grid-cols-2 gap-6 md:gap-8 items-center">
          <div className="space-y-4 md:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
              Rooster Scan
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
              Smart health monitoring for your roosters. Simply upload a photo to get comprehensive AI-powered health insights, pose analysis, and professional care recommendations.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link to="/pose"><Camera className="mr-2 h-4 w-4" /> Analyze Rooster</Link>
              </Button>
              <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto">
                <Link to="/learn"><GraduationCap className="mr-2 h-4 w-4" /> Educational Hub</Link>
              </Button>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Custom YOLO pose detection</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Sequential AI validation</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>17 anatomical keypoints</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">✓</span>
                <span>Clinical recommendations</span>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="aspect-video rounded-2xl border bg-black/95 overflow-hidden shadow-xl">
              <RoosterPoseVisualization />
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard cards */}
      <section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureCard icon={<Camera className="text-rose-500" />} title="AI Pose Analysis" desc="Upload images for 17-keypoint pose detection and health classification." to="/pose"/>
          <FeatureCard icon={<Bird className="text-amber-600" />} title="My Gamefowl" desc="Create profiles, attach scans, and track care routines." to="/gamefowl"/>
          <FeatureCard icon={<History className="text-rose-500" />} title="Scan History" desc="Review analysis results, track health progress over time." to="/history"/>
          <FeatureCard icon={<GraduationCap className="text-amber-600" />} title="Educational Hub" desc="Learn about rooster anatomy and health monitoring techniques." to="/learn"/>
        </div>
      </section>

      {/* Health Reports */}
      <section className="rounded-2xl border p-4 sm:p-6 md:p-8 bg-card">
        <div className="space-y-6 md:space-y-0 md:flex items-center gap-10">
          <div className="md:w-1/2">
            <h2 className="text-xl sm:text-2xl font-semibold">Health Reports</h2>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Each scan generates a structured assessment including detected abnormalities, severity hints, and recommendations. Track progress over time and export to share with vets or keep records.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Button asChild className="w-full sm:w-auto">
                <Link to="/history"><Activity className="mr-2 h-4 w-4"/> View Reports</Link>
              </Button>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/pose">Analyze Rooster</Link>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-xl border p-3 sm:p-4 bg-gradient-to-br from-primary/5 to-transparent">
                <p className="text-xs text-muted-foreground">Abnormalities</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">
                  {loading ? '...' : abnormalitiesCount}
                </p>
              </div>
              <div className="rounded-xl border p-3 sm:p-4 bg-gradient-to-br from-primary/5 to-transparent">
                <p className="text-xs text-muted-foreground">Last Scan</p>
                <p className="text-base sm:text-lg font-bold">
                  {loading ? '...' : lastScan}
                </p>
              </div>
              <div className="rounded-xl border p-3 sm:p-4 col-span-2">
                <p className="text-xs text-muted-foreground mb-1">Summary</p>
                <p className="text-xs sm:text-sm">
                  {loading ? 'Loading...' : 
                   totalScans === 0 ? 'No scans yet. Upload your first rooster image to get started!' :
                   `${totalScans} total scan${totalScans !== 1 ? 's' : ''} • ${abnormalitiesCount} with detected issues`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

function FeatureCard({ icon, title, desc, to }: { icon: React.ReactNode; title: string; desc: string; to: string }) {
  return (
    <Link to={to} className="group rounded-xl border p-4 sm:p-5 bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="h-9 w-9 sm:h-10 sm:w-10 grid place-items-center rounded-lg bg-gradient-to-br from-rose-500/10 to-amber-500/10 border">
          {icon}
        </div>
        <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
      </div>
      <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{desc}</p>
    </Link>
  );
}
