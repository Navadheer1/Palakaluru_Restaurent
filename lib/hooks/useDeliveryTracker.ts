"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { calculateHaversineDistance } from "@/lib/maps/provider";

export interface DeliveryTrackerOptions {
  deliveryId: string | null;
  isActive: boolean; // Only true when status === 'picked_up' or 'out_for_delivery'
  minIntervalMs?: number; // Minimum ms between API writes (default: 12000 = 12s)
  minDistanceMeters?: number; // Minimum distance in meters before triggering write (default: 25m)
  onLocationUpdate?: (coords: { lat: number; lng: number; accuracy: number | null }) => void;
}

export interface DeliveryTrackerState {
  isTracking: boolean;
  permissionGranted: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  isOnline: boolean;
  isLowAccuracy: boolean;
  lastSyncTime: Date | null;
  errorMessage: string | null;
}

export function useDeliveryTracker({
  deliveryId,
  isActive,
  minIntervalMs = 12000,
  minDistanceMeters = 25,
  onLocationUpdate,
}: DeliveryTrackerOptions) {
  const [state, setState] = useState<DeliveryTrackerState>({
    isTracking: false,
    permissionGranted: false,
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    heading: null,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isLowAccuracy: false,
    lastSyncTime: null,
    errorMessage: null,
  });

  const lastRecordedCoords = useRef<{ lat: number; lng: number; timestamp: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const pendingBufferRef = useRef<any | null>(null);

  // Network state listeners
  useEffect(() => {
    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true, errorMessage: null }));
      // Flush buffered location if any
      if (pendingBufferRef.current && deliveryId && isActive) {
        sendLocation(pendingBufferRef.current);
        pendingBufferRef.current = null;
      }
    };
    const handleOffline = () => {
      setState((prev) => ({
        ...prev,
        isOnline: false,
        errorMessage: "Connection lost. Location will sync when connection returns.",
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [deliveryId, isActive]);

  // Transmit location to secure backend API
  const sendLocation = useCallback(
    async (payload: {
      deliveryId: string;
      latitude: number;
      longitude: number;
      accuracy: number | null;
      heading: number | null;
      speed: number | null;
      batteryLevel?: number | null;
    }) => {
      if (!navigator.onLine) {
        pendingBufferRef.current = payload;
        return;
      }

      try {
        const res = await fetch("/api/delivery/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.success) {
          setState((prev) => ({
            ...prev,
            lastSyncTime: new Date(),
            errorMessage: null,
          }));
        } else if (data.trackingActive === false) {
          // Backend notified that delivery is no longer active
          stopTracking();
        }
      } catch (err: any) {
        pendingBufferRef.current = payload;
        setState((prev) => ({
          ...prev,
          errorMessage: "Network sync delayed. Buffering GPS location...",
        }));
      }
    },
    []
  );

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isTracking: false }));
  }, []);

  // Main tracking effect: Starts only on active delivery, stops on complete/unmount
  useEffect(() => {
    if (!isActive || !deliveryId) {
      stopTracking();
      return;
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        errorMessage: "Geolocation is not supported by your device browser.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true }));

    // Setup GPS watchPosition with battery and movement optimization
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords;
        const now = Date.now();
        const isLowAccuracy = accuracy > 55; // >55m considered low accuracy

        setState((prev) => ({
          ...prev,
          permissionGranted: true,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          isLowAccuracy,
        }));

        if (onLocationUpdate) {
          onLocationUpdate({ lat: latitude, lng: longitude, accuracy });
        }

        // Check if movement or time threshold is satisfied
        let shouldSend = false;

        if (!lastRecordedCoords.current) {
          shouldSend = true;
        } else {
          const timeElapsed = now - lastRecordedCoords.current.timestamp;
          const distKm = calculateHaversineDistance(
            { lat: lastRecordedCoords.current.lat, lng: lastRecordedCoords.current.lng },
            { lat: latitude, lng: longitude }
          );
          const distMeters = distKm * 1000;

          // Send if:
          // 1. Min interval has passed AND moved at least minDistanceMeters
          // 2. OR 30 seconds heartbeat has passed (even if idle at traffic light)
          if ((timeElapsed >= minIntervalMs && distMeters >= minDistanceMeters) || timeElapsed >= 30000) {
            shouldSend = true;
          }
        }

        if (shouldSend) {
          lastRecordedCoords.current = { lat: latitude, lng: longitude, timestamp: now };

          // Optional battery level
          let batteryLevel: number | null = null;
          try {
            if ("getBattery" in navigator) {
              const battery: any = await (navigator as any).getBattery();
              batteryLevel = Math.round(battery.level * 100);
            }
          } catch {}

          sendLocation({
            deliveryId,
            latitude,
            longitude,
            accuracy,
            heading,
            speed,
            batteryLevel,
          });
        }
      },
      (err) => {
        let msg = "GPS location error";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow GPS access to start delivery tracking.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "GPS position unavailable. Check device location services.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS signal timeout. Acquiring satellite lock...";
        }
        setState((prev) => ({
          ...prev,
          permissionGranted: false,
          errorMessage: msg,
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );

    return () => {
      stopTracking();
    };
  }, [isActive, deliveryId, minIntervalMs, minDistanceMeters, sendLocation, stopTracking, onLocationUpdate]);

  return {
    ...state,
    stopTracking,
  };
}
