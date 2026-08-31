export async function fetchLocationWeatherSummary(location: string, startDate: string, endDate: string): Promise<string> {
  try {
    const geoResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`,
      { cache: "no-store" },
    );
    if (!geoResponse.ok) return "";
    const geo = await geoResponse.json() as {
      results?: Array<{ latitude: number; longitude: number; name?: string }>;
    };
    const place = geo.results?.[0];
    if (!place) return "";

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=weather_code,precipitation_sum&start_date=${startDate}&end_date=${endDate}&timezone=auto`,
      { cache: "no-store" },
    );
    if (!weatherResponse.ok) return "";
    const weather = await weatherResponse.json() as {
      daily?: { weather_code?: number[]; precipitation_sum?: number[] };
    };
    const codes = weather.daily?.weather_code || [];
    const rain = (weather.daily?.precipitation_sum || []).reduce((sum, value) => sum + Number(value || 0), 0);
    const stormy = codes.some((code) => code >= 95);
    const snowy = codes.some((code) => code >= 71 && code < 80);
    const rainy = codes.some((code) => code >= 61) || rain >= 8;
    const clear = codes.filter((code) => code <= 1).length >= Math.max(1, Math.floor(codes.length / 2));

    if (stormy) return `Storm risk near ${place.name || location}`;
    if (snowy) return `Snow likely near ${place.name || location}`;
    if (rainy) return `Rain expected near ${place.name || location}`;
    if (clear) return `Mostly clear near ${place.name || location}`;
    return `Mixed conditions near ${place.name || location}`;
  } catch {
    return "";
  }
}
