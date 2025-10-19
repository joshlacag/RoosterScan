import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Camera, History, Library, Settings, Bird, Home, LogOut, Scan, Menu, X } from "lucide-react";
import PageTransition from "./PageTransition";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { useEffect, useState } from "react";
import { getUser, signOut, onAuthStateChange } from "@/lib/auth";
import type { User } from "@supabase/supabase-js";

const nav = [
  { to: "/", label: "Home", icon: Home, public: true },
  { to: "/learn", label: "Educational Hub", icon: Library, public: true },
  { to: "/pose", label: "AI Pose Analysis", icon: Scan, public: false },
  { to: "/gamefowl", label: "My Gamefowl", icon: Bird, public: false },
  { to: "/history", label: "Scan History", icon: History, public: false },
  { to: "/settings", label: "Settings", icon: Settings, public: false },
];

export default function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    // Get initial user state
    getUser().then(setUser);
    
    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/40 text-foreground">
      <header className="sticky top-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-gradient-to-br from-primary to-primary/70 grid place-items-center text-primary-foreground shadow">
              <span className="sr-only">RoosterX Scan</span>
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* outer rounded square for subtle frame */}
                  <rect x="3" y="3" width="18" height="18" rx="4" ry="4" opacity="0.15" />
                  {/* scanner corners */}
                  <path d="M9 6H6v3M15 6h3v3M9 18H6v-3M15 18h3v-3" />
                </g>
              </svg>
            </div>
            <div>
              <p className="font-extrabold leading-tight tracking-tight text-xl">Rooster Scan</p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(({ to, label, public: isPublic }) => {
              // Show protected routes only if user is authenticated
              if (!isPublic && !user) {
                return (
                  <button
                    key={to}
                    onClick={() => navigate("/auth")}
                    className="px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                    title="Sign in required"
                  >
                    {label}
                  </button>
                );
              }
              
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive || pathname === to
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )
                  }
                >
                  {label}
                </NavLink>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild variant="gradient" className="hidden sm:inline-flex">
                <Link to="/pose">Analyze Rooster</Link>
              </Button>
            ) : (
              <Button variant="gradient" className="hidden sm:inline-flex" onClick={() => navigate("/auth")}>
                Analyze Rooster
              </Button>
            )}
            {user ? (
              <Button variant="outline" className="hidden sm:inline-flex" onClick={async () => { 
                await signOut(); 
                navigate("/auth"); 
              }}>
                <LogOut className="mr-2 h-4 w-4"/> Sign Out
              </Button>
            ) : (
              <Button variant="outline" className="hidden sm:inline-flex" asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
            
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4 mt-8">
                  {nav.map(({ to, label, icon: Icon, public: isPublic }) => {
                    if (!isPublic && !user) {
                      return (
                        <button
                          key={to}
                          onClick={() => {
                            setMobileMenuOpen(false);
                            navigate("/auth");
                          }}
                          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:text-foreground hover:bg-muted"
                        >
                          <Icon className="h-5 w-5" />
                          {label}
                        </button>
                      );
                    }
                    
                    return (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                            isActive || pathname === to
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )
                        }
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </NavLink>
                    );
                  })}
                  
                  <div className="border-t pt-4 mt-4 space-y-2">
                    {user ? (
                      <>
                        <Button asChild variant="gradient" className="w-full">
                          <Link to="/pose" onClick={() => setMobileMenuOpen(false)}>
                            <Scan className="mr-2 h-4 w-4" />
                            Analyze Rooster
                          </Link>
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={async () => { 
                            setMobileMenuOpen(false);
                            await signOut(); 
                            navigate("/auth"); 
                          }}
                        >
                          <LogOut className="mr-2 h-4 w-4"/> Sign Out
                        </Button>
                      </>
                    ) : (
                      <Button variant="gradient" className="w-full" asChild>
                        <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                      </Button>
                    )}
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="container px-4 sm:px-6 lg:px-8 py-6 md:py-12">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
