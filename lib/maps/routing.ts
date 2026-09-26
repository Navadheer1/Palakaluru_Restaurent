import { Coordinates, RouteResult, ETAResult } from "./types";
import { getMapProvider } from "./provider";
import { mapCache } from "./cache";

export async function calculateRoute(
  origin: Coordinates,
  destination: Coordinates
): Promise<RouteResult> {
  const cacheKey = `route:${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
  const cached = mapCache.get<RouteResult>(cacheKey);
  if (cached) return cached;

  const provider = getMapProvider();
  const result = await provider.calculateRoute(origin, destination);

  if (result) {
    // Cache route for 15 minutes
    mapCache.set(cacheKey, result, 900);
  }

  return result;
}

export async function getETA(
  origin: Coordinates,
  destination: Coordinates
): Promise<ETAResult> {
  const cacheKey = `eta:${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
  const cached = mapCache.get<ETAResult>(cacheKey);
  if (cached) return cached;

  const provider = getMapProvider();
  const result = await provider.getETA(origin, destination);

  if (result) {
    // Cache ETA for 3 minutes
    mapCache.set(cacheKey, result, 180);
  }

  return result;
}
