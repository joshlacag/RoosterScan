import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useNavigate } from "react-router-dom";
import { signIn, signUp, resetPassword, updatePassword, signInWithGoogle } from "@/lib/auth";
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
  const urlParams = new URLSearchParams(location.search);
  const mode = urlParams.get('mode');
  const defaultTab = mode === 'reset' ? 'reset' : 'signin';
  
  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to Rooster Scan</h1>
        <p className="text-muted-foreground mt-2">
          {mode === 'reset' ? 'Reset your password to continue' : 'Sign in to access advanced rooster health monitoring features'}
        </p>
        {from && !mode && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              Please sign in to continue to <span className="font-medium">{from}</span>
            </p>
          </div>
        )}
      </div>

      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className={`grid w-full ${mode === 'reset' ? 'grid-cols-1' : 'grid-cols-3'} mb-8`}>
          {mode !== 'reset' && (
            <>
              <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Sign Up
              </TabsTrigger>
              <TabsTrigger value="forgot" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Reset
              </TabsTrigger>
            </>
          )}
          {mode === 'reset' && (
            <TabsTrigger value="reset" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Set New Password
            </TabsTrigger>
          )}
        </TabsList>
        
        {mode !== 'reset' && (
          <>
            <TabsContent value="signin" className="mt-0">
              <AuthForm mode="signin" submitLabel="Sign In" redirectTo={from || "/"} />
            </TabsContent>
            <TabsContent value="signup" className="mt-0">
              <AuthForm mode="signup" submitLabel="Create Account" redirectTo={from || "/"} />
            </TabsContent>
            <TabsContent value="forgot" className="mt-0">
              <ForgotPasswordForm />
            </TabsContent>
          </>
        )}
        {mode === 'reset' && (
          <TabsContent value="reset" className="mt-0">
            <ResetPasswordForm redirectTo={from || "/"} />
          </TabsContent>
        )}
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
        // If email confirmation is required, show success message instead of redirected
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      await signInWithGoogle();
      // Note: Google OAuth will redirect, so no need to handle success here
    } catch (err: any) {
      setError(err.message || "Google sign in failed");
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
        
        {/* Google Sign In Button */}
        <Button
          type="button"
          variant="outline"
          className="w-full h-11 border-gray-300 hover:bg-gray-50"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </Button>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
          </div>
        </div>
        
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
      
    </div>
  );
}

// Forgot Password Form Component
function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await resetPassword(email);
      setSuccess("Password reset email sent! Please check your inbox and follow the instructions.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Reset Your Password</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
          <Label htmlFor="reset-email" className="text-sm font-medium">Email Address</Label>
          <Input 
            id="reset-email"
            type="email" 
            placeholder="Enter your email address"
            className="h-11"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-11" 
          disabled={loading || !email}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Sending reset email...
            </div>
          ) : (
            "Send Reset Email"
          )}
        </Button>
      </form>
    </div>
  );
}

// Reset Password Form Component (for when user clicks email link)
function ResetPasswordForm({ redirectTo }: { redirectTo: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updatePassword(password);
      setSuccess("Password updated successfully! Redirecting...");
      setTimeout(() => navigate(redirectTo, { replace: true }), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Set New Password</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your new password below.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
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
          <Label htmlFor="new-password" className="text-sm font-medium">New Password</Label>
          <div className="relative">
            <Input 
              id="new-password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password (min. 6 characters)"
              className="h-11 pr-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm Password</Label>
          <Input 
            id="confirm-password"
            type="password"
            placeholder="Confirm your new password"
            className="h-11"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full h-11" 
          disabled={loading || !password || !confirmPassword}
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Updating password...
            </div>
          ) : (
            "Update Password"
          )}
        </Button>
      </form>
    </div>
  );
}
