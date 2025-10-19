import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Settings() {
  const [dark, setDark] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const pref = localStorage.getItem("theme") || "light";
    const isDark = pref === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    // Load other preferences
    const technical = localStorage.getItem("showTechnicalDetails") === "true";
    setShowTechnicalDetails(technical);
    
    const autoSavePref = localStorage.getItem("autoSave") !== "false";
    setAutoSave(autoSavePref);
  }, []);

  const toggleTheme = (v: boolean) => {
    setDark(v);
    document.documentElement.classList.toggle("dark", v);
    localStorage.setItem("theme", v ? "dark" : "light");
  };

  const toggleTechnicalDetails = (v: boolean) => {
    setShowTechnicalDetails(v);
    localStorage.setItem("showTechnicalDetails", v.toString());
    toast.success(v ? "Technical details enabled" : "Technical details disabled");
  };

  const toggleAutoSave = (v: boolean) => {
    setAutoSave(v);
    localStorage.setItem("autoSave", v.toString());
    toast.success(v ? "Auto-save enabled" : "Auto-save disabled");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error) {
      toast.error("Failed to logout");
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Manage your app preferences.</p>
      </div>

      {/* Appearance Settings */}
      <div className="rounded-lg sm:rounded-xl border p-4 sm:p-5 bg-card">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Appearance</h2>
        <div className="flex items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="font-medium text-sm sm:text-base">Dark Mode</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Use a dark appearance across the app.</p>
          </div>
          <Switch checked={dark} onCheckedChange={toggleTheme} className="flex-shrink-0" />
        </div>
      </div>

      {/* Analysis Settings */}
      <div className="rounded-lg sm:rounded-xl border p-4 sm:p-5 bg-card">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Analysis Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-sm sm:text-base">Show Technical Details</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Display pose keypoints and confidence scores.</p>
            </div>
            <Switch checked={showTechnicalDetails} onCheckedChange={toggleTechnicalDetails} className="flex-shrink-0" />
          </div>
          <Separator />
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-medium text-sm sm:text-base">Auto-save Results</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Automatically save analysis results to database.</p>
            </div>
            <Switch checked={autoSave} onCheckedChange={toggleAutoSave} className="flex-shrink-0" />
          </div>
        </div>
      </div>

      {/* Account Settings */}
      <div className="rounded-lg sm:rounded-xl border p-4 sm:p-5 bg-card">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Account</h2>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <p className="font-medium text-sm sm:text-base">Sign Out</p>
            <p className="text-xs sm:text-sm text-muted-foreground">Log out of your account.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="w-full sm:w-auto" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            <span className="text-xs sm:text-sm">Logout</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
