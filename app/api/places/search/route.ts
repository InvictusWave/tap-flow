import { after, NextRequest, NextResponse } from 'next/server';
import {
  reviewUrlFromGoogleMapsFeatureId,
  searchGoogleReviewPlaces,
} from '@/lib/google-review';
import { getCachedValue, setCachedValue } from '@/lib/redis';

export interface PlaceResult {
  placeId: string;
  name: string;
  location: string;
  googleReviewUrl: string;
}

type LegacyGooglePlace = {
  place_id: string;
  name: string;
  formatted_address?: string;
};

type PhotonFeature = {
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    osm_id?: string | number;
  };
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim().slice(0, 100);

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `places:${encodeURIComponent(query.toLocaleLowerCase('id-ID'))}`;
  const cached = await getCachedValue<PlaceResult[]>(cacheKey);
  if (cached) {
    return NextResponse.json(
      { results: cached },
      { headers: { 'X-TapFlow-Cache': 'HIT-REDIS' } }
    );
  }

  const respond = (results: PlaceResult[]) => {
    after(() => setCachedValue(cacheKey, results, 3600));
    return NextResponse.json(
      { results },
      { headers: { 'X-TapFlow-Cache': 'MISS-WARMED' } }
    );
  };

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

  // 1. If Google Places API key is configured, use Google Places Text Search (Real Google Data with ChIJ Place ID)
  if (googleApiKey) {
    try {
      const results = await searchGoogleReviewPlaces(query, googleApiKey);
      if (results.length > 0) {
        return respond(results);
      }
    } catch (err) {
      console.error('Google Places API (New) error:', err);
    }

    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query
        )}&key=${googleApiKey}&language=id`,
        { cache: 'no-store' }
      );
      if (gRes.ok) {
        const gData = await gRes.json() as { results?: LegacyGooglePlace[] };
        if (gData.results?.length) {
          const results: PlaceResult[] = gData.results.slice(0, 8).map((p) => ({
            placeId: p.place_id,
            name: p.name,
            location: p.formatted_address || '',
            googleReviewUrl: `https://search.google.com/local/writereview?placeid=${p.place_id}`,
          }));
          return respond(results);
        }
      }
    } catch (err) {
      console.error('Google Places API (Legacy) error:', err);
    }
  }

  // ponytail: undocumented fallback; configure GOOGLE_PLACES_API_KEY if Google changes this response.
  // 2. High-precision Google Maps Live Search (Finds exact real Indonesian businesses, branches, and full addresses)
  try {
    const url = `https://www.google.com/search?tbm=map&q=${encodeURIComponent(query)}&hl=id`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const text = await res.text();
      const cleanJson = text.replace(/^\)\]\}\x27?\s*\n?/, '');
      const rawData = JSON.parse(cleanJson);

      const results: PlaceResult[] = [];
      const entries = rawData[0]?.[1] || [];

      for (const entry of entries) {
        if (!Array.isArray(entry)) continue;
        const p = entry[14];
        if (Array.isArray(p) && p[11]) {
          const name = p[11];
          const fullAddress = p[39] || p[2] || p[18] || '';
          const hexId = p[10];
          
          const reviewUrl =
            reviewUrlFromGoogleMapsFeatureId(hexId) ??
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${name}, ${fullAddress || ''}`.trim()
            )}`;

          results.push({
            placeId: hexId || name,
            name,
            location: fullAddress
              ? fullAddress.replace(new RegExp(`^${name},\\s*`, 'i'), '')
              : '',
            googleReviewUrl: reviewUrl,
          });
        }
      }

      if (results.length > 0) {
        return respond(results.slice(0, 8));
      }
    }
  } catch (err) {
    console.error('Google Maps live search error:', err);
  }

  // 3. Fallback: Photon Geocoder (Street level address search)
  try {
    const photonRes = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`,
      {
        headers: { 'Accept-Language': 'id,en;q=0.9' },
        cache: 'no-store',
      }
    );

    if (photonRes.ok) {
      const pData = await photonRes.json() as { features?: PhotonFeature[] };
      if (pData.features?.length) {
        const results: PlaceResult[] = pData.features
          .filter((f) => f.properties?.name)
          .map((f, i) => {
            const p = f.properties!;
            const name = p.name || query;

            const addressParts = [
              p.street ? `${p.street}${p.housenumber ? ` No. ${p.housenumber}` : ''}` : '',
              p.district,
              p.city || p.county,
              p.state,
              p.country !== 'Indonesia' ? p.country : '',
              p.postcode,
            ].filter(Boolean);

            const location = addressParts.length > 0 ? addressParts.join(', ') : 'Indonesia';
            const cleanPlaceId = `osm:${p.osm_id || i}`;
            const encodedQuery = encodeURIComponent(`${name} ${location}`.trim());
            const googleUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;

            return {
              placeId: cleanPlaceId,
              name,
              location,
              googleReviewUrl: googleUrl,
            };
          });

        if (results.length > 0) {
          return respond(results.slice(0, 8));
        }
      }
    }
  } catch (err) {
    console.error('Photon search error:', err);
  }

  // 4. Default Direct Query Fallback
  const directEncoded = encodeURIComponent(query);
  const fallbackResults: PlaceResult[] = [
    {
      placeId: 'custom-direct',
      name: query,
      location: 'Cari di Google Maps Indonesia',
      googleReviewUrl: `https://www.google.com/maps/search/?api=1&query=${directEncoded}`,
    },
  ];

  return respond(fallbackResults);
}
