"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Utensils, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSetupSuccess = searchParams.get("setup") === "success";

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    isSetupSuccess ? "Restaurant and Admin account created successfully! Please sign in." : null
  );

  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetEmail, setResetEmail] = React.useState("");
  const [resetSent, setResetSent] = React.useState(false);
  const [resetLoading, setResetLoading] = React.useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else if (data?.user) {
        router.push("/");
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setResetSent(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send reset link");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 text-white shadow-xl shadow-brand-500/25">
          <Utensils className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase">
          Palakaluru Restaurant
        </h1>
        <p className="text-xs text-slate-400 font-medium">
          Restaurant Management System
        </p>
      </div>

      {/* Main Login Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        {successMessage && (
          <div className="mb-5 flex items-start space-x-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 flex items-start space-x-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {!showForgotPassword ? (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="admin@palakaluru.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-4 w-4" />}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(true);
                    setResetEmail(email);
                    setErrorMessage(null);
                  }}
                  className="text-[11px] text-brand-400 hover:text-brand-300 font-medium transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="h-4 w-4" />}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 space-x-2 shadow-lg shadow-brand-600/25"
              isLoading={isLoading}
            >
              <span>SIGN IN</span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Quick Demo Credentials Strip */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-semibold">Quick Role Logins:</span>
                <span className="text-[10px] text-brand-400 font-medium">Click to fill credentials</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Waiter", email: "waiter@palakaluru.com", pass: "Waiter@123", badge: "Tables & KOT" },
                  { label: "Admin", email: "admin@palakaluru.com", pass: "Admin@123", badge: "Full Access" },
                  { label: "Cashier", email: "cashier@palakaluru.com", pass: "Cashier@123", badge: "Billing" },
                  { label: "Kitchen", email: "kitchen@palakaluru.com", pass: "Kitchen@123", badge: "KDS Prep" },
                ].map((acc) => (
                  <button
                    key={acc.label}
                    type="button"
                    onClick={() => {
                      setEmail(acc.email);
                      setPassword(acc.pass);
                    }}
                    className="text-left p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-brand-500/50 transition-all group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-brand-400">
                        {acc.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5 font-mono">
                      {acc.email}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4 animate-in fade-in-50">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Reset Password</h3>
              <p className="text-xs text-slate-400">
                Enter your registered admin email address and we will send a password reset link.
              </p>
            </div>

            {resetSent ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs text-emerald-400 space-y-2">
                <p className="font-semibold">Reset instructions sent!</p>
                <p className="text-[11px]">Check your inbox at {resetEmail} to reset your password.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetSent(false);
                  }}
                  className="w-full mt-2"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@palakaluru.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    icon={<Mail className="h-4 w-4" />}
                    required
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-1/2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-1/2"
                    isLoading={resetLoading}
                  >
                    Send Link
                  </Button>
                </div>
              </>
            )}
          </form>
        )}


      </div>

      {/* Footer System Notice */}
      <div className="text-center text-[11px] text-slate-500">
        Palakaluru Restaurant Operations Terminal • Secured by Supabase
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex items-center justify-center p-8 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500 mr-2" />
          <span className="text-xs">Loading terminal...</span>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
