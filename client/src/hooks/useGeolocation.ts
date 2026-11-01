import { useCallback, useState } from 'react';

export interface UseGeolocationReturn {
  latitude: number | null;
  longitude: number | null;
  loading: boolean;
  error: string | null;
  detectLocation: () => Promise<{ latitude: number; longitude: number }>;
}

export function useGeolocation(): UseGeolocationReturn {
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = useCallback(async (): Promise<{ latitude: number; longitude: number }> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const fallback = { latitude: 28.6139, longitude: 77.209 };
        setLatitude(fallback.latitude);
        setLongitude(fallback.longitude);
        setError('Geolocation is not supported by your browser. Using municipal capital baseline.');
        setLoading(false);
        resolve(fallback);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setLatitude(coords.latitude);
          setLongitude(coords.longitude);
          setLoading(false);
          resolve(coords);
        },
        (err) => {
          // Graceful fallback to New Delhi municipal center
          const fallback = { latitude: 28.6139, longitude: 77.209 };
          setLatitude(fallback.latitude);
          setLongitude(fallback.longitude);
          setError(`Location permission denied or timed out (${err.message}). Using municipal baseline.`);
          setLoading(false);
          resolve(fallback);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    });
  }, []);

  return {
    latitude,
    longitude,
    loading,
    error,
    detectLocation,
  };
}

