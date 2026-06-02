import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Database, Eye, EyeOff } from "lucide-react";

export default function Auth() {
  const { session, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full">
      {/* Left: Login form - Stitch design */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-24 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="/logo.png"
                alt="Company logo"
                className="size-10 rounded-lg object-cover shrink-0"
              />
              <h2 className="text-2xl font-bold tracking-tight">Xsheva CRM</h2>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">Welcome back</h3>
            <p className="text-muted-foreground">
              Please enter your details to sign in to your Xsheva CRM account.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="h-14 rounded-lg"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative flex w-full items-stretch">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="h-14 rounded-lg pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-bold rounded-lg shadow-lg shadow-[hsl(var(--accent-action))/0.2]"
              variant="accent"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Sign In
            </Button>
          </form>

          <div className="pt-8 text-center border-t">
            <p className="text-muted-foreground text-sm">
              Don&apos;t have an account?{" "}
              <a
                href="#"
                className="font-bold text-[hsl(var(--accent-action))] hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                Contact Sales
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Right: Brand gradient panel - Stitch design */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#1337ec] items-center justify-center p-12 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 max-w-lg text-center">
          <div className="mb-8 inline-flex items-center justify-center p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
            <img
              src="/logo.png"
              alt="Company logo"
              className="w-16 h-16 rounded-xl object-cover"
            />
          </div>
          <h1 className="text-white text-5xl font-extrabold mb-6 tracking-tight">
            The future of CRM is here.
          </h1>
          <p className="text-white/80 text-lg font-medium leading-relaxed">
            Streamline your sales process, manage customer relationships, and scale your business
            with Xsheva CRM&apos;s intelligent platform.
          </p>
        </div>
        <div className="absolute bottom-12 left-12 flex items-center gap-2 text-white/60 text-sm">
          <span>© 2024 Xsheva CRM. All rights reserved.</span>
        </div>
      </div>
    </div>
  );
}
