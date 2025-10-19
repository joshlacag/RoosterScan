import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { signIn, signUp } from "@/lib/auth";
import { useState } from "react";
import { CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type Form = z.infer<typeof schema>;

export default function Auth() {
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname as string | undefined;
  
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Rooster Scan</h1>
        <p className="text-muted-foreground mt-2">
          Sign in to access advanced rooster health monitoring features
        </p>
        {from && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Please sign in to continue to <span className="font-medium">{from}</span>
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue="signin" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Sign In
          </TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Sign Up
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="signin" className="mt-0">
          <AuthForm mode="signin" submitLabel="Sign In" redirectTo={from || "/"} />
        </TabsContent>
        <TabsContent value="signup" className="mt-0">
          <AuthForm mode="signup" submitLabel="Create Account" redirectTo={from || "/"} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuthForm({ 
  mode, 
  submitLabel, 
  redirectTo 
}: { 
  mode: "signin" | "signup";
  submitLabel: string; 
  redirectTo: string; 
}) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  const { register, handleSubmit, formState } = useForm<Form>({ 
    resolver: zodResolver(schema) 
  });

  const onSubmit = async (data: Form) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      if (mode === "signin") {
        await signIn(data.email, data.password);
        setSuccess("Welcome back! Redirecting...");
        setTimeout(() => navigate(redirectTo, { replace: true }), 1000);
      } else {
        const result = await signUp(data.email, data.password);
        // If email confirmation is required, show success message instead of redirecting
        if (result.user && !result.session) {
          setSuccess("Account created! Please check your email and click the confirmation link to complete registration.");
          return;
        }
        setSuccess("Account created successfully! Redirecting...");
        setTimeout(() => navigate(redirectTo, { replace: true }), 1000);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="flex items-center gap-3 p-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-3 p-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
          <Input 
            id="email"
            type="email" 
            placeholder="Enter your email"
            className="h-11"
            autoComplete="email"
            {...register("email")} 
            disabled={loading}
          />
          {formState.errors.email && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formState.errors.email.message}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Input 
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={mode === "signup" ? "Create a password (min. 6 characters)" : "Enter your password"}
              className="h-11 pr-10"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              {...register("password")} 
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={loading}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formState.errors.password && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formState.errors.password.message}
            </p>
          )}
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-11 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-medium" 
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {mode === "signin" ? "Signing in..." : "Creating account..."}
            </div>
          ) : (
            submitLabel
          )}
        </Button>
      </form>
      
      {mode === "signup" && (
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By creating an account, you agree to our{" "}
            <button className="text-primary hover:underline">Terms of Service</button>
            {" "}and{" "}
            <button className="text-primary hover:underline">Privacy Policy</button>
          </p>
        </div>
      )}
      
      {mode === "signin" && (
        <div className="text-center">
          <button className="text-sm text-primary hover:underline">
            Forgot your password?
          </button>
        </div>
      )}
    </div>
  );
}
