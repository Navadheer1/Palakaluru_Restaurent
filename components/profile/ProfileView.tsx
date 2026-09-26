"use client";

import * as React from "react";
import {
  User,
  Mail,
  Phone,
  Store,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { UserRole } from "@/lib/constants";

interface ProfileViewProps {
  role: UserRole;
}

export function ProfileView({ role }: ProfileViewProps) {
  const { profile, restaurant, branch, invalidateAuthProfile } = useAuthProfile();

  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState<string | null>(null);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (profile) {
      setName(profile.full_name || profile.name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          full_name: name.trim(),
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        setProfileError(error.message);
      } else {
        setProfileSuccess("Profile updated successfully!");
        invalidateAuthProfile();
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setPasswordError(error.message);
      } else {
        setPasswordSuccess("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
          <User className="h-6 w-6 mr-2 text-brand-600" />
          My Account & Security
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal staff details, branch access, and credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Role Badge & Identity Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-black text-2xl mb-4 border border-brand-200 dark:border-brand-900">
              {(profile?.full_name || profile?.name || role).substring(0, 2).toUpperCase()}
            </div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {profile?.full_name || profile?.name || "Staff Member"}
            </h2>
            <p className="text-xs text-slate-500 truncate mt-0.5">{profile?.email}</p>

            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              Role: {role}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-left space-y-2 text-xs">
              <div className="flex items-center text-slate-600 dark:text-slate-400">
                <Store className="h-4 w-4 mr-2 text-slate-400" />
                <span className="font-semibold">{restaurant?.name || "Palakaluru Grand"}</span>
              </div>
              <div className="text-[11px] text-slate-400 pl-6">
                Branch: {branch?.name || "Palakaluru Main Campus"}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <User className="h-4 w-4 mr-2 text-brand-600" />
              Personal Information
            </h3>

            {profileSuccess && (
              <div className="mb-4 flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 flex items-center space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  icon={<User className="h-4 w-4 text-slate-400" />}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Email Address
                </label>
                <Input
                  value={profile?.email || ""}
                  disabled
                  className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 cursor-not-allowed"
                  icon={<Mail className="h-4 w-4 text-slate-400" />}
                />
                <p className="text-[10px] text-slate-400 mt-1">Email is managed by system administrator.</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  icon={<Phone className="h-4 w-4 text-slate-400" />}
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" isLoading={isSavingProfile}>
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Password Form */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <Lock className="h-4 w-4 mr-2 text-brand-600" />
              Change Password
            </h3>

            {passwordSuccess && (
              <div className="mb-4 flex items-center space-x-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 flex items-center space-x-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    icon={<Lock className="h-4 w-4 text-slate-400" />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Confirm New Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  icon={<Lock className="h-4 w-4 text-slate-400" />}
                  required
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" size="sm" isLoading={isChangingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
