import { Coordinates, GeocodeResult } from "./types";
import { getMapProvider } from "./provider";
import { mapCache } from "./cache";

export async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  const clean = address.trim();
  if (!clean) return null;

  const cacheKey = `geo:${clean.toLowerCase()}`;
  const cached = mapCache.get<GeocodeResult>(cacheKey);
  if (cached) return cached;

  const provider = getMapProvider();
  const result = await provider.geocode(clean);

  if (result) {
    // Cache for 24 hours to minimize paid API calls
    mapCache.set(cacheKey, result, 86400);
  }

  return result;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const coords: Coordinates = {
    lat: Number(lat.toFixed(5)),
    lng: Number(lng.toFixed(5)),
  };

  const cacheKey = `revgeo:${coords.lat},${coords.lng}`;
  const cached = mapCache.get<string>(cacheKey);
  if (cached) return cached;

  const provider = getMapProvider();
  const address = await provider.reverseGeocode(coords);

  if (address) {
    mapCache.set(cacheKey, address, 86400);
  }

  return address;
}
