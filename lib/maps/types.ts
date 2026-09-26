export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeocodeResult {
  formattedAddress: string;
  coordinates: Coordinates;
  landmark?: string | null;
  placeId?: string;
  confidence?: number;
}

export interface RouteResult {
  origin: Coordinates;
  destination: Coordinates;
  distanceKm: number;
  durationMins: number;
  polyline: Coordinates[];
  summary?: string;
}

export interface ETAResult {
  durationMins: number;
  distanceKm: number;
  text: string;
}

export type MapProviderType = "google" | "mapbox" | "here" | "production_fallback";

export interface MapProviderConfig {
  provider: MapProviderType;
  clientApiKey?: string;
  serverApiKey?: string;
}
