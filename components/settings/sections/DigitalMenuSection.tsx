"use client";

import * as React from "react";
import { QrCode, Download, Printer, ExternalLink, Palette, Smartphone, Sliders, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function DigitalMenuSection() {
  const { digitalMenu, profile, pendingChanges, updatePending } = useSettingsStore();

  const currentMenu = pendingChanges?.digitalMenu || digitalMenu;
  const currentProfile = pendingChanges?.profile || profile;

  const [activeSubTab, setActiveSubTab] = React.useState<"qr_flyer" | "appearance" | "toggles">("qr_flyer");

  const handleMenuChange = (field: keyof typeof currentMenu, val: any) => {
    updatePending("digitalMenu", { [field]: val });
  };

  const qrUrl = typeof window !== "undefined"
    ? `${window.location.origin}/menu`
    : "http://localhost:3000/menu";

  const handleDownloadQR = () => {
    const svgElement = document.getElementById("restaurant-qr-code");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `palakaluru_table_qr_${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handlePrintQR = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 pb-2 space-x-2">
        <button
          onClick={() => setActiveSubTab("qr_flyer")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "qr_flyer"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <QrCode className="h-4 w-4" />
          <span>Permanent QR & Table Flyer</span>
        </button>
        <button
          onClick={() => setActiveSubTab("appearance")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "appearance"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Palette className="h-4 w-4" />
          <span>Theme & Card Layout</span>
        </button>
        <button
          onClick={() => setActiveSubTab("toggles")}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
            activeSubTab === "toggles"
              ? "bg-brand-500/10 text-brand-600 dark:text-brand-400"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Display Badges & WhatsApp</span>
        </button>
      </div>

      {/* 1. PERMANENT QR & TABLE FLYER */}
      {activeSubTab === "qr_flyer" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-7 space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
                <QrCode className="h-4 w-4 mr-2 text-brand-600" />
                Permanent Restaurant QR Architecture
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                The QR code URL is fixed and permanent. When you update dishes, prices, or sold-out items, customers instantly see updates without needing new physical table stands reprinted!
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Public Digital Menu URL:
                </span>
                <div className="flex items-center space-x-2">
                  <Input value={qrUrl} readOnly className="font-mono text-xs bg-white dark:bg-slate-900" />
                  <a href="/menu" target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm" className="h-10 px-3">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button variant="primary" size="sm" onClick={handleDownloadQR} className="space-x-1.5">
                  <Download className="h-3.5 w-3.5" />
                  <span>Download Print SVG</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintQR} className="space-x-1.5">
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Table Flyer</span>
                </Button>
              </div>
            </div>
          </div>

          {/* QR Standee Preview */}
          <div className="md:col-span-5 flex justify-center">
            <div className="w-full max-w-[280px] p-6 rounded-2xl bg-gradient-to-b from-amber-50 to-white dark:from-slate-900 dark:to-slate-950 border border-amber-200/80 dark:border-slate-800 shadow-lg text-center space-y-4">
              <div>
                <Badge variant="brand" size="sm">
                  Table QR Standee
                </Badge>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mt-2">
                  {currentProfile.name}
                </h4>
                <p className="text-[11px] text-slate-500">Scan with any mobile camera</p>
              </div>

              <div className="p-4 bg-white rounded-2xl shadow-inner inline-block mx-auto border border-slate-200 dark:border-slate-700">
                <QRCodeSVG
                  id="restaurant-qr-code"
                  value={qrUrl}
                  size={160}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Browse Authentic Menu & Order
                </p>
                <p className="text-[10px] text-slate-500">Powered by CulinaCloud RMS</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. APPEARANCE & THEME */}
      {activeSubTab === "appearance" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Palette className="h-4 w-4 mr-2 text-brand-600" />
            Digital Menu Theme & Presentation
          </h3>
          <p className="text-xs text-slate-500">
            Customize the guest smartphone visual theme, course tab navigation, and dish card layout.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Visual Color Palette
              </label>
              <select
                value={currentMenu.theme}
                onChange={(e) => handleMenuChange("theme", e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
              >
                <option value="amber">Warm Amber & Gold (Biryani / Traditional)</option>
                <option value="emerald">Fresh Emerald & Mint (Vegetarian / Cafe)</option>
                <option value="slate">Modern Charcoal & Slate (Fine Dining)</option>
                <option value="crimson">Royal Crimson & Spice (Tandoori / Barbecue)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Dish Card Style
              </label>
              <select
                value={currentMenu.itemCardStyle}
                onChange={(e) => handleMenuChange("itemCardStyle", e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium"
              >
                <option value="rich">Rich Visuals with High-Res Photos</option>
                <option value="compact">Compact List (Fast Scroll)</option>
                <option value="minimal">Minimal Typography Only</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 3. DISPLAY TOGGLES */}
      {activeSubTab === "toggles" && (
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center">
            <Sliders className="h-4 w-4 mr-2 text-brand-600" />
            Customer Visible Features & WhatsApp Integration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentMenu.showPrices}
                onChange={(e) => handleMenuChange("showPrices", e.target.checked)}
                className="rounded text-brand-600 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Show Item Prices
              </span>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentMenu.showVegetarianIndicators}
                onChange={(e) => handleMenuChange("showVegetarianIndicators", e.target.checked)}
                className="rounded text-brand-600 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Show Veg / Non-Veg Badges
              </span>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentMenu.showPopularBadges}
                onChange={(e) => handleMenuChange("showPopularBadges", e.target.checked)}
                className="rounded text-brand-600 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Show 'Chef Special / Bestseller' Badges
              </span>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 cursor-pointer">
              <input
                type="checkbox"
                checked={currentMenu.whatsappOrdering}
                onChange={(e) => handleMenuChange("whatsappOrdering", e.target.checked)}
                className="rounded text-brand-600 h-4 w-4"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Enable 1-Click WhatsApp Ordering
              </span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
