"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Logo from "@/components/ui/Logo";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState<"role" | "form">("role");
  const [registerAs, setRegisterAs] = useState<"member" | "admin" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);

    try {
      await register(name, email, password, registerAs || "member", reason);
      
      if (registerAs === "admin") {
        router.push("/pending-approval");
      } else {
        router.push("/dashboard/member");
      }
    } catch (err) {
      setError((err as Error).message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  if (step === "role") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-md">
          <div className="space-y-6">
            <div className="text-center">
              <Logo variant="full" className="justify-center mb-4" />
              <h2 className="text-2xl text-white font-bold">Join Us</h2>
              <p className="text-zinc-400 text-sm mt-1">How do you want to register?</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setRegisterAs("member");
                  setStep("form");
                }}
                className="w-full p-4 border-2 border-zinc-700 rounded-lg hover:border-blue-500 hover:bg-blue-500/10 transition text-left"
              >
                <div className="font-semibold">👤 Register as Member</div>
                <div className="text-sm text-zinc-400 mt-1">
                  Join clubs and attend events
                </div>
              </button>

              <button
                onClick={() => {
                  setRegisterAs("admin");
                  setStep("form");
                }}
                className="w-full p-4 border-2 border-zinc-700 rounded-lg hover:border-green-500 hover:bg-green-500/10 transition text-left"
              >
                <div className="font-semibold">👑 Request Admin Access</div>
                <div className="text-sm text-zinc-400 mt-1">
                  Manage clubs and events (needs approval)
                </div>
              </button>
            </div>

            <div className="text-center">
              <p className="text-zinc-400">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl text-white font-bold mb-2">Create Account</h1>
            <p className="text-zinc-400">
              {registerAs === "member"
                ? "Join as a member"
                : "Request admin access"}
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            {registerAs === "admin" && (
              <Input
                label="Why do you want admin access?"
                type="text"
                placeholder="e.g., I want to manage events..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            )}

            {error && (
              <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <button
            onClick={() => setStep("role")}
            className="w-full text-zinc-400 hover:text-white text-sm py-2"
          >
            ← Back to role selection
          </button>

          <div className="text-center">
            <p className="text-zinc-400 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
