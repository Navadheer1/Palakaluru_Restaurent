"use client";

import * as React from "react";
import { Palette, Eye, Sun, Moon, Laptop, Check } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

const PRESET_PALETTES = [
  { name: "Royal Amber (Default)", primary: "#d97706", accent: "#10b981", desc: "Warm and inviting" },
  { name: "Emerald Harvest", primary: "#059669", accent: "#f59e0b", desc: "Fresh organic herbs" },
  { name: "Classic Navy", primary: "#2563eb", accent: "#f97316", desc: "Professional and crisp" },
  { name: "Crimson Spice", primary: "#dc2626", accent: "#eab308", desc: "Fiery and bold" },
  { name: "Imperial Purple", primary: "#7c3aed", accent: "#06b6d4", desc: "Premium boutique" },
];

export function AppearanceSection() {
  const { appearance, pendingChanges, updatePending } = useSettingsStore();

  const currentAppearance = pendingChanges?.appearance || appearance;

  const handleAppearanceChange = (field: keyof typeof currentAppearance, val: any) => {
    updatePending("appearance", { [field]: val });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Palette className="h-4 w-4 mr-2 text-brand-600" />
              Restaurant Brand Theme & Color Scheme
            </h3>
            <p className="text-xs text-slate-500">
              Customize the administrative workspace and cashier terminals to match your brand palette.
            </p>

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Recommended Brand Palettes
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PRESET_PALETTES.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      updatePending("appearance", {
                        primaryColor: preset.primary,
                        accentColor: preset.accent,
                      });
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                      currentAppearance.primaryColor === preset.primary
                        ? "border-brand-600 bg-brand-50/40 dark:bg-brand-950/20 ring-1 ring-brand-500"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-5 h-5 rounded-full shadow-xs border border-white dark:border-slate-700"
                        style={{ backgroundColor: preset.primary }}
                      />
                      <div>
                        <span className="text-xs font-bold block text-slate-900 dark:text-slate-100">
                          {preset.name}
                        </span>
                        <span className="text-[10px] text-slate-500">{preset.desc}</span>
                      </div>
                    </div>
                    {currentAppearance.primaryColor === preset.primary && (
                      <Check className="h-4 w-4 text-brand-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Primary Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={currentAppearance.primaryColor}
                    onChange={(e) => handleAppearanceChange("primaryColor", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <Input
                    value={currentAppearance.primaryColor}
                    onChange={(e) => handleAppearanceChange("primaryColor", e.target.value)}
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Success / Secondary Accent
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={currentAppearance.accentColor}
                    onChange={(e) => handleAppearanceChange("accentColor", e.target.value)}
                    className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5"
                  />
                  <Input
                    value={currentAppearance.accentColor}
                    onChange={(e) => handleAppearanceChange("accentColor", e.target.value)}
                    className="font-mono text-xs uppercase"
                  />
                </div>
              </div>
            </div>

            {/* UI Density & Button Styles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Button Corner Radius
                </label>
                <select
                  value={currentAppearance.buttonStyle}
                  onChange={(e) => handleAppearanceChange("buttonStyle", e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
                >
                  <option value="rounded-xl">Rounded Curved (Default)</option>
                  <option value="rounded-lg">Slightly Rounded</option>
                  <option value="rounded-full">Fully Pill Rounded</option>
                  <option value="square">Modern Sharp Square</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Interface Display Density
                </label>
                <select
                  value={currentAppearance.uiDensity}
                  onChange={(e) => handleAppearanceChange("uiDensity", e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
                >
                  <option value="comfortable">Comfortable Touch (Generous Padding)</option>
                  <option value="compact">Compact POS (High item density for fast touch)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Preview: Live UI Component Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <Eye className="h-4 w-4 mr-1.5 text-brand-600" />
              Live Theme Preview
            </span>
            <Badge variant="brand" size="sm">
              Real-time Render
            </Badge>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: currentAppearance.primaryColor }}
              >
                P
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Palakaluru Restaurant
                </h4>
                <p className="text-[11px] text-slate-500">Live Branding Sample</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Spl Chicken Dum Biryani
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: currentAppearance.primaryColor }}
                >
                  ₹320.00
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Fragrant basmati cooked with tender farm chicken & secret spices.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                style={{ backgroundColor: currentAppearance.primaryColor }}
                className={`flex-1 py-2 text-xs font-bold text-white shadow-xs ${currentAppearance.buttonStyle}`}
              >
                Primary Action Button
              </button>
              <button
                type="button"
                className={`px-3 py-2 text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 ${currentAppearance.buttonStyle}`}
              >
                Cancel
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Density: {currentAppearance.uiDensity}</span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentAppearance.accentColor }} />
                <span>WCAG Contrast Safe</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
