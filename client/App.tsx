import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Gamefowl from "./pages/Gamefowl";
import History from "./pages/History";
import Learn from "./pages/Learn";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import RequireAuth from "./components/RequireAuth";
import Report from "./pages/Report";
import PoseAnalysis from "./pages/PoseAnalysis";
import ScanResults from "./pages/ScanResults";
import ArticleReader from "./pages/ArticleReader";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Public pages - no authentication required */}
              <Route path="/" element={<Index />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/learn/article/:id" element={<ArticleReader />} />
              <Route path="/auth" element={<Auth />} />
              
              {/* Protected pages - require authentication */}
              <Route path="/pose" element={<RequireAuth><PoseAnalysis /></RequireAuth>} />
              <Route path="/scan-results/:scanId" element={<RequireAuth><ScanResults /></RequireAuth>} />
              <Route path="/gamefowl" element={<RequireAuth><Gamefowl /></RequireAuth>} />
              <Route path="/history" element={<RequireAuth><History /></RequireAuth>} />
              <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
              <Route path="/report/:id" element={<RequireAuth><Report /></RequireAuth>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
