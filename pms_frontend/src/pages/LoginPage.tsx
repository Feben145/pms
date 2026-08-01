import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(username, password);
      navigate("/", { replace: true });
    } catch {
      setError("Incorrect username or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4">
      <Card className="w-full max-w-sm border-white/10 bg-ink-soft text-neutral-100">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded bg-accent flex items-center justify-center text-ink font-bold text-sm">
              P
            </div>
            <span className="font-semibold tracking-tight">Property OS</span>
          </div>

          <h1 className="text-lg font-semibold mb-1">Sign in</h1>
          <p className="text-sm text-neutral-400 mb-6">Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red-300 bg-red-950/50 border border-red-900 rounded px-3 py-2">
                {error}
              </div>
            )}

            <div>
              <Label className="text-neutral-300">Username</Label>
              <Input
                className="bg-white/5 border-white/10 text-neutral-100 focus-visible:ring-accent"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div>
              <Label className="text-neutral-300">Password</Label>
              <Input
                type="password"
                className="bg-white/5 border-white/10 text-neutral-100 focus-visible:ring-accent"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" variant="accent" disabled={isSubmitting} className="w-full mt-2">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
