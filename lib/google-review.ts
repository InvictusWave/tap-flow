export interface GoogleReviewPlace {
  placeId: string;
  name: string;
  location: string;
  googleReviewUrl: string;
}

export function isDirectGoogleReviewUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const isGoogleHost =
      url.hostname === 'google.com' || url.hostname.endsWith('.google.com');
    return (
      (url.hostname === 'search.google.com' && url.pathname === '/local/writereview') ||
      (url.hostname === 'g.page' && url.pathname.endsWith('/review')) ||
      (isGoogleHost && url.pathname.startsWith('/maps/place/') && url.pathname.includes('!12e1')) ||
      (isGoogleHost && url.searchParams.get('action') === 'write-review')
    );
  } catch {
    return false;
  }
}

export async function searchGoogleReviewPlaces(
  query: string,
  apiKey: string
): Promise<GoogleReviewPlace[]> {
  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.googleMapsLinks.writeAReviewUri',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'id', maxResultCount: 8 }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Places API request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    places?: Array<{
      id?: string;
      displayName?: { text?: string };
      formattedAddress?: string;
      googleMapsLinks?: { writeAReviewUri?: string };
    }>;
  };

  return (data.places ?? []).flatMap((place) => {
    const placeId = place.id?.trim();
    const name = place.displayName?.text?.trim();
    if (!placeId || !name) return [];

    return [
      {
        placeId,
        name,
        location: place.formattedAddress ?? '',
        googleReviewUrl:
          place.googleMapsLinks?.writeAReviewUri ??
          `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`,
      },
    ];
  });
}

export async function resolveDirectGoogleReviewUrl(
  businessName: string,
  location: string | null | undefined,
  apiKey: string
): Promise<string | null> {
  const places = await searchGoogleReviewPlaces(
    [businessName, location].filter(Boolean).join(', '),
    apiKey
  );
  return places[0]?.googleReviewUrl ?? null;
}
