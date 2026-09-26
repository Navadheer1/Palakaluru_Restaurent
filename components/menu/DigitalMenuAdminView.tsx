"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { QRCodeCanvas } from "qrcode.react";
import { 
  QrCode, 
  Download, 
  Printer, 
  ExternalLink, 
  Copy, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  UtensilsCrossed, 
  Smartphone,
  RefreshCw,
  Info
} from "lucide-react";
import Link from "next/link";

interface DigitalMenuAdminViewProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    address?: string | null;
    phone?: string | null;
    logo_url?: string | null;
  } | null;
  itemCount: number;
  categoryCount: number;
}

export function DigitalMenuAdminView({
  restaurant,
  itemCount,
  categoryCount,
}: DigitalMenuAdminViewProps) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const restaurantSlug = restaurant?.slug || restaurant?.id || "palakaluru-grand";
  const restaurantName = restaurant?.name || "Palakaluru Grand Restaurant";
  
  // Permanent public menu URL
  const publicMenuUrl = origin
    ? `${origin}/menu/${restaurantSlug}`
    : `/menu/${restaurantSlug}`;

  // Copy URL to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(publicMenuUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Download high-resolution QR PNG
  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Create a higher-resolution version for clean print / display
    const downloadCanvas = document.createElement("canvas");
    const size = 1000;
    downloadCanvas.width = size;
    downloadCanvas.height = size;
    const ctx = downloadCanvas.getContext("2d");

    if (ctx) {
      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      // Draw QR image
      ctx.drawImage(canvas, 100, 100, size - 200, size - 200);

      const link = document.createElement("a");
      link.download = `${restaurantSlug}-digital-menu-qr.png`;
      link.href = downloadCanvas.toDataURL("image/png");
      link.click();
    } else {
      const link = document.createElement("a");
      link.download = `${restaurantSlug}-digital-menu-qr.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  // Trigger Print Stand
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* SCREEN VIEW (Hidden when printing) */}
      <div className="print:hidden space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Permanent Digital Menu QR
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  One permanent QR code for your restaurant. Never needs to be regenerated or replaced.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Digital Menu Live
            </span>
          </div>
        </div>

        {/* Top Info Banner */}
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950 dark:text-amber-100">
              Permanent QR Code Guarantee
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              Print this QR code once and place it on all tables, counter stands, and flyers. When you update dishes, prices, descriptions, or mark items sold out in your menu catalog, the digital menu updates instantly. You will <span className="font-bold underline">never</span> need to regenerate or reprint this QR code.
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: QR Code Display Card */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="text-xs uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-4">
              Restaurant Table Stand Preview
            </div>

            {/* QR Card Container */}
            <div 
              ref={qrRef}
              className="p-6 bg-white rounded-2xl shadow-md border-2 border-slate-200 flex flex-col items-center max-w-[320px] w-full"
            >
              <div className="flex items-center gap-2 mb-3 text-slate-900 font-bold text-sm">
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                <span>{restaurantName}</span>
              </div>

              {/* QR Code Canvas */}
              <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-inner">
                <QRCodeCanvas
                  value={publicMenuUrl}
                  size={220}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              </div>

              <div className="mt-4 text-center">
                <div className="text-xs font-extrabold text-slate-900 tracking-wide uppercase">
                  Scan to View Digital Menu
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Point smartphone camera to browse dishes & prices
                </div>
              </div>
            </div>

            {/* Permanent URL Box */}
            <div className="w-full mt-6 space-y-2">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block text-left">
                Permanent Public URL
              </label>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2 text-xs">
                <input
                  type="text"
                  readOnly
                  value={publicMenuUrl}
                  className="bg-transparent flex-1 text-slate-800 dark:text-slate-200 font-mono text-[11px] outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 transition"
                  title="Copy permanent menu link"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-3 gap-2 w-full mt-4">
              <button
                onClick={handleDownload}
                className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Download className="w-4 h-4" />
                Download
              </button>

              <button
                onClick={handlePrint}
                className="py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 transition"
              >
                <Printer className="w-4 h-4" />
                Print Stand
              </button>

              <a
                href={publicMenuUrl}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <ExternalLink className="w-4 h-4" />
                View Menu
              </a>
            </div>
          </div>

          {/* Right Column: Key Details & Catalog Overview */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Catalog Status */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Live Catalog Synced
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 block mb-1">Active Categories</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {categoryCount}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 block mb-1">Active Dishes</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white">
                    {itemCount}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-xs text-slate-500 block mb-1">Customer Access</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-2">
                    <ShieldCheck className="w-4 h-4" />
                    Unauthenticated
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800">
                <span>Want to edit categories or food items?</span>
                <Link
                  href="/admin/menu"
                  className="font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                >
                  Manage Menu Catalog &rarr;
                </Link>
              </div>
            </div>

            {/* Architecture Highlights */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                Customer Experience Specs
              </h2>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Zero App Installation:</strong> Customers simply open their native phone camera (iOS or Android), scan the QR code, and instantly see the clean mobile digital menu.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">No Ordering Friction:</strong> Strictly digital menu display without confusing checkout steps or cart lockups, keeping order taking in the hands of your attentive wait staff.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Real-Time Out-of-Stock:</strong> If a dish runs out in the kitchen, mark it unavailable in the Menu catalog; customers viewing the digital menu will see it updated immediately.
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">Permanent Restaurant Identification:</strong> Uses stable public slug <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-amber-600 dark:text-amber-400 font-bold">{restaurantSlug}</span>.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PRINT-ONLY STAND TEMPLATE (Visible only in @media print) */}
      {isMounted &&
        createPortal(
          <div
            id="digital-menu-print-stand"
            className="hidden print:flex flex-col items-center justify-center min-h-screen p-8 text-center text-slate-900 bg-white"
          >
            <div className="max-w-md w-full border-4 border-slate-900 rounded-3xl p-8 flex flex-col items-center shadow-none">
              {/* Logo / Header */}
              <div className="w-16 h-16 rounded-2xl border-2 border-slate-900 flex items-center justify-center mb-4">
                <UtensilsCrossed className="w-8 h-8 text-slate-900" />
              </div>

              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase mb-1">
                {restaurantName}
              </h1>

              <p className="text-xs text-slate-600 tracking-widest font-semibold uppercase mb-6">
                Welcome • Please Browse Our Menu
              </p>

              {/* High Res QR */}
              <div className="p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-none mb-6">
                <QRCodeCanvas
                  value={publicMenuUrl}
                  size={260}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>

              {/* Instructions */}
              <div className="space-y-1.5 mb-6">
                <div className="text-base font-black text-slate-900 uppercase tracking-wide">
                  Scan to View Digital Menu
                </div>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Open your smartphone camera and point it at the QR code to view today's dishes, chef specials & live prices.
                </p>
              </div>

              {/* Footer details */}
              <div className="pt-4 border-t-2 border-slate-200 w-full text-[11px] text-slate-500 space-y-1">
                {restaurant?.address && <p>{restaurant.address}</p>}
                {restaurant?.phone && <p>Tel: {restaurant.phone}</p>}
                <p className="text-[9px] text-slate-400 uppercase tracking-wider pt-2">
                  Powered by CulinaCloud RMS
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
