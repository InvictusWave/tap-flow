import { NextRequest, NextResponse } from 'next/server';

export interface PlaceResult {
  placeId: string;
  name: string;
  location: string;
  googleReviewUrl: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;

  // 1. If Google Places API key is configured, use Google Places Text Search (Real Google Data with ChIJ Place ID)
  if (googleApiKey) {
    try {
      const gRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query
        )}&key=${googleApiKey}&language=id`,
        { cache: 'no-store' }
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData.results && gData.results.length > 0) {
          const results: PlaceResult[] = gData.results.slice(0, 8).map((p: any) => ({
            placeId: p.place_id,
            name: p.name,
            location: p.formatted_address || '',
            googleReviewUrl: `https://search.google.com/local/writereview?placeid=${p.place_id}`,
          }));
          return NextResponse.json({ results });
        }
      }
    } catch (err) {
      console.error('Google Places API error:', err);
    }
  }

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
          
          let reviewUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${name}, ${fullAddress || ''}`.trim()
          )}`;

          // Google Maps CID generates official working direct URL: https://maps.google.com/?cid=...
          if (hexId && typeof hexId === 'string' && hexId.includes(':')) {
            const cidHex = hexId.split(':')[1];
            try {
              const cidDec = BigInt(cidHex).toString(10);
              reviewUrl = `https://maps.google.com/?cid=${cidDec}`;
            } catch {
              // fallback
            }
          }

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
        return NextResponse.json({ results: results.slice(0, 8) });
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
      const pData = await photonRes.json();
      if (pData.features && pData.features.length > 0) {
        const results: PlaceResult[] = pData.features
          .filter((f: any) => f.properties?.name)
          .map((f: any, i: number) => {
            const p = f.properties;
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
            const cleanPlaceId = `ChIJ_${p.osm_id || i}`;
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
          return NextResponse.json({ results: results.slice(0, 8) });
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

  return NextResponse.json({ results: fallbackResults });
}
