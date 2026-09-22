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
  Camera,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Restaurant, Branch } from "@/types/database";

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [restaurant, setRestaurant] = React.useState<Restaurant | null>(null);
  const [branch, setBranch] = React.useState<Branch | null>(null);

  // Form states
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [profileSuccess, setProfileSuccess] = React.useState<string | null>(null);
  const [profileError, setProfileError] = React.useState<string | null>(null);

  // Password state
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isChangingPassword, setIsChangingPassword] = React.useState(false);
  const [passwordSuccess, setPasswordSuccess] = React.useState<string | null>(null);
  const [passwordError, setPasswordError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchUserData() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const { data: p } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (p) {
          setProfile(p);
          setName(p.full_name || p.name || "");
          setPhone(p.phone || "");
          setAvatarUrl(p.avatar_url || "");

          if (p.restaurant_id) {
            const { data: r } = await supabase
              .from("restaurants")
              .select("*")
              .eq("id", p.restaurant_id)
              .single();
            if (r) setRestaurant(r);
          }

          if (p.branch_id) {
            const { data: b } = await supabase
              .from("branches")
              .select("*")
              .eq("id", p.branch_id)
              .single();
            if (b) setBranch(b);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }

    fetchUserData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSavingProfile(true);
    setProfileSuccess(null);
    setProfileError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          full_name: name.trim(),
          phone: phone.trim(),
          avatar_url: avatarUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        setProfileError(error.message);
      } else {
        setProfileSuccess("Admin profile updated successfully!");
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                name: name.trim(),
                full_name: name.trim(),
                phone: phone.trim(),
                avatar_url: avatarUrl.trim() || null,
              }
            : null
        );
      }
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
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
        setPasswordSuccess("Password updated successfully through Supabase Auth!");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
          <User className="h-6 w-6 mr-2 text-brand-600" />
          Admin Profile & Security
        </h1>
        <p className="text-xs text-slate-500">
          Manage your personal administrator identity, contact details, and account credentials
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Role summary */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="relative mx-auto h-20 w-20">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name || "Admin"}
                  className="h-20 w-20 rounded-full object-cover border-2 border-brand-500"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold text-xl dark:bg-brand-950 dark:text-brand-300 border-2 border-brand-500/30">
                  {name ? name.substring(0, 2).toUpperCase() : "AD"}
                </div>
              )}
              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {name || "Administrator"}
              </h3>
              <p className="text-xs text-slate-500">{profile?.email}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/30">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  ADMIN (Protected)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ACTIVE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Restaurant:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                  {restaurant?.name || "Palakaluru Restaurant"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Branch:</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {branch?.name || "Main Branch"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Edit Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* General Details Form */}
          <form
            onSubmit={handleUpdateProfile}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center">
              <User className="h-4 w-4 mr-2 text-brand-600" />
              Personal Information
            </h3>

            {profileSuccess && (
              <div className="flex items-center space-x-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center space-x-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Full Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Nayudu Navadheer"
                  icon={<User className="h-4 w-4" />}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Email Address
                </label>
                <Input
                  value={profile?.email || ""}
                  disabled
                  icon={<Mail className="h-4 w-4" />}
                  className="opacity-70 cursor-not-allowed bg-slate-50 dark:bg-slate-950"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Primary account email managed by Supabase Auth.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Phone Number
                </label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98480 12345"
                  icon={<Phone className="h-4 w-4" />}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Avatar Image URL
                </label>
                <Input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.com/avatar.jpg"
                  icon={<Camera className="h-4 w-4" />}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingProfile}
                className="space-x-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Save Profile Changes</span>
              </Button>
            </div>
          </form>

          {/* Password Change Form */}
          <form
            onSubmit={handlePasswordChange}
            className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center">
              <Lock className="h-4 w-4 mr-2 text-brand-600" />
              Change Password (Supabase Auth)
            </h3>

            {passwordSuccess && (
              <div className="flex items-center space-x-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center space-x-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    icon={<Lock className="h-4 w-4" />}
                    required
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

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Confirm New Password
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="outline"
                size="md"
                isLoading={isChangingPassword}
                className="space-x-1.5"
              >
                <Lock className="h-4 w-4" />
                <span>Update Password</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
