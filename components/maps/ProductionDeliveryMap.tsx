"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { 
  Bike, 
  MapPin, 
  Store, 
  Plus, 
  Minus, 
  Maximize2, 
  Compass, 
  AlertTriangle, 
  Clock,
  Layers
} from "lucide-react";
import { Coordinates } from "@/lib/maps/types";

interface DeliveryMapProps {
  restaurant: {
    lat: number;
    lng: number;
    name: string;
  };
  rider?: {
    lat: number;
    lng: number;
    name: string;
    lastUpdated?: string | null;
    isStale?: boolean;
    isLowAccuracy?: boolean;
    heading?: number | null;
    speed?: number | null;
  } | null;
  customer?: {
    lat: number;
    lng: number;
    address?: string;
    landmark?: string | null;
  } | null;
  polyline?: Coordinates[];
  isAdjustingPin?: boolean;
  onCustomerPinMove?: (coords: Coordinates) => void;
  className?: string;
}

export function ProductionDeliveryMap({
  restaurant,
  rider,
  customer,
  polyline = [],
  isAdjustingPin = false,
  onCustomerPinMove,
  className = "",
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingMap, setIsDraggingMap] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggingPin, setIsDraggingPin] = useState(false);

  // Compute bounding box
  const bounds = useMemo(() => {
    const points: Coordinates[] = [
      { lat: restaurant.lat, lng: restaurant.lng },
      ...(rider ? [{ lat: rider.lat, lng: rider.lng }] : []),
      ...(customer ? [{ lat: customer.lat, lng: customer.lng }] : []),
      ...polyline,
    ];

    let minLat = points[0].lat;
    let maxLat = points[0].lat;
    let minLng = points[0].lng;
    let maxLng = points[0].lng;

    points.forEach((p) => {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLng = Math.min(minLng, p.lng);
      maxLng = Math.max(maxLng, p.lng);
    });

    // Add padding margin (0.005 deg ~ 500m)
    const padding = 0.006;
    return {
      minLat: minLat - padding,
      maxLat: maxLat + padding,
      minLng: minLng - padding,
      maxLng: maxLng + padding,
      width: Math.max(0.01, maxLng - minLng + padding * 2),
      height: Math.max(0.01, maxLat - minLat + padding * 2),
    };
  }, [restaurant, rider, customer, polyline]);

  // Transform geo coords (lat, lng) to SVG viewBox percentages (0..1000 x 0..700)
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 700;

  const projectToSvg = useCallback(
    (coords: Coordinates) => {
      const xPercent = (coords.lng - bounds.minLng) / bounds.width;
      const yPercent = (bounds.maxLat - coords.lat) / bounds.height;
      return {
        x: Math.max(40, Math.min(SVG_WIDTH - 40, xPercent * SVG_WIDTH)),
        y: Math.max(40, Math.min(SVG_HEIGHT - 40, yPercent * SVG_HEIGHT)),
      };
    },
    [bounds]
  );

  // Invert SVG coords back to geo lat/lng for draggable pin
  const unprojectFromSvg = useCallback(
    (svgX: number, svgY: number) => {
      const xPercent = svgX / SVG_WIDTH;
      const yPercent = svgY / SVG_HEIGHT;
      const lng = bounds.minLng + xPercent * bounds.width;
      const lat = bounds.maxLat - yPercent * bounds.height;
      return { lat: Number(lat.toFixed(5)), lng: Number(lng.toFixed(5)) };
    },
    [bounds]
  );

  // Render SVG path for polyline
  const polylinePath = useMemo(() => {
    if (!polyline || polyline.length < 2) {
      if (rider && customer) {
        const p1 = projectToSvg(rider);
        const p2 = projectToSvg(customer);
        return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
      }
      return "";
    }
    const points = polyline.map(projectToSvg);
    return points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, "");
  }, [polyline, projectToSvg, rider, customer]);

  const restPos = projectToSvg(restaurant);
  const riderPos = rider ? projectToSvg(rider) : null;
  const custPos = customer ? projectToSvg(customer) : null;

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 2.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.75));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Dragging the map canvas
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAdjustingPin) return;
    setIsDraggingMap(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingMap) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingMap(false);
    setIsDraggingPin(false);
  };

  // Adjust pin interaction
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAdjustingPin || !onCustomerPinMove || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left - pan.x) / (rect.width * zoom)) * SVG_WIDTH;
    const clickY = ((e.clientY - rect.top - pan.y) / (rect.height * zoom)) * SVG_HEIGHT;
    const newCoords = unprojectFromSvg(clickX, clickY);
    onCustomerPinMove(newCoords);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className={`relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 select-none ${
        isAdjustingPin ? "cursor-crosshair" : isDraggingMap ? "cursor-grabbing" : "cursor-grab"
      } ${className}`}
      style={{ minHeight: "480px" }}
    >
      {/* Background Cartography Grid / Roads Simulation */}
      <div
        className="absolute inset-0 transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full h-full"
          onClick={handleSvgClick}
        >
          <defs>
            {/* Grid pattern */}
            <pattern id="roadGrid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#1e293b" strokeWidth="1" />
            </pattern>
            {/* Pulsing glow for rider */}
            <filter id="riderGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Map Surface */}
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="#0b1120" />
          <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#roadGrid)" opacity="0.6" />

          {/* Stylized background arterial road lines */}
          <path
            d="M 50 150 Q 300 200 600 120 T 950 250"
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.4"
          />
          <path
            d="M 120 580 Q 400 450 700 520 T 900 620"
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.4"
          />
          <path
            d="M 250 50 L 300 650"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          <path
            d="M 750 50 L 700 650"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />

          {/* Active Navigation Polyline Route */}
          {polylinePath && (
            <>
              {/* Outer glow line */}
              <path
                d={polylinePath}
                fill="none"
                stroke="#0284c7"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.3"
              />
              {/* Primary route line */}
              <path
                d={polylinePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6,4"
              />
            </>
          )}

          {/* 1. Restaurant Base Marker */}
          <g transform={`translate(${restPos.x}, ${restPos.y})`}>
            <circle r="22" fill="#d97706" opacity="0.2" />
            <circle r="15" fill="#f59e0b" stroke="#ffffff" strokeWidth="2.5" />
            <text
              y="32"
              textAnchor="middle"
              className="fill-amber-300 font-bold text-[11px]"
              style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
            >
              {restaurant.name}
            </text>
          </g>

          {/* 2. Customer Destination Marker */}
          {custPos && (
            <g transform={`translate(${custPos.x}, ${custPos.y})`}>
              <circle
                r={isAdjustingPin ? "24" : "18"}
                fill="#e11d48"
                opacity={isAdjustingPin ? "0.4" : "0.2"}
                className={isAdjustingPin ? "animate-pulse" : ""}
              />
              <circle r="14" fill="#f43f5e" stroke="#ffffff" strokeWidth="2.5" />
              <text
                y="30"
                textAnchor="middle"
                className="fill-rose-300 font-bold text-[11px]"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
              >
                {isAdjustingPin ? "Click to set destination" : "Customer Destination"}
              </text>
            </g>
          )}

          {/* 3. Live Delivery Boy Marker */}
          {riderPos && (
            <g transform={`translate(${riderPos.x}, ${riderPos.y})`}>
              {/* Accuracy circle if low accuracy */}
              {rider?.isLowAccuracy && (
                <circle
                  r="38"
                  fill="#f59e0b"
                  opacity="0.15"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              )}

              {/* Pulse ripple */}
              {!rider?.isStale && (
                <circle r="26" fill="#06b6d4" opacity="0.25" className="animate-ping" />
              )}

              {/* Scooter circle */}
              <circle
                r="18"
                fill={rider?.isStale ? "#64748b" : "#0284c7"}
                stroke="#ffffff"
                strokeWidth="2.5"
                filter="url(#riderGlow)"
              />

              {/* Heading arrow pointer if heading exists */}
              {typeof rider?.heading === "number" && (
                <g transform={`rotate(${rider.heading})`}>
                  <path d="M 0 -24 L 5 -18 L -5 -18 Z" fill="#38bdf8" />
                </g>
              )}

              <text
                y="34"
                textAnchor="middle"
                className="fill-cyan-300 font-extrabold text-[11px]"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}
              >
                🛵 {rider?.name || "Delivery Partner"}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Floating Status & Stale Warnings Overlay */}
      <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
        {/* Live Rider Badge */}
        {rider && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-xs shadow-lg pointer-events-auto">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                rider.isStale ? "bg-slate-400" : "bg-cyan-400 animate-pulse"
              }`}
            />
            <span className="font-bold text-white">{rider.name}</span>
            <span className="text-slate-400">•</span>
            {rider.isStale ? (
              <span className="text-amber-400 flex items-center gap-1 font-medium">
                <Clock className="w-3 h-3" />
                {rider.lastUpdated ? `Stale (${rider.lastUpdated})` : "Location unavailable"}
              </span>
            ) : (
              <span className="text-cyan-300 font-medium">
                {rider.lastUpdated ? `Updated ${rider.lastUpdated}` : "Live Tracking"}
              </span>
            )}
          </div>
        )}

        {/* Low Accuracy Warning */}
        {rider?.isLowAccuracy && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs backdrop-blur-md">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Low GPS accuracy (~50m margin)</span>
          </div>
        )}

        {/* Pin adjustment active indicator */}
        {isAdjustingPin && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-semibold backdrop-blur-md animate-pulse">
            <MapPin className="w-4 h-4 text-rose-400" />
            <span>Adjust Pin Mode: Click anywhere on map to reposition customer destination</span>
          </div>
        )}
      </div>

      {/* Map Control Buttons (Zoom / Center / Layers) */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-md backdrop-blur-sm transition"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-md backdrop-blur-sm transition"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white flex items-center justify-center border border-slate-700 shadow-md backdrop-blur-sm transition"
          title="Reset View"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Restaurant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
          <span>Delivery Partner</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Customer</span>
        </div>
      </div>
    </div>
  );
}
