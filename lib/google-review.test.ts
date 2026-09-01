import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node's native TypeScript loader requires the file extension.
import { isDirectGoogleReviewUrl, reviewUrlFromGoogleMapsFeatureId } from './google-review.ts';

test('accepts Google review composer links only', () => {
  assert.equal(
    isDirectGoogleReviewUrl(
      'https://www.google.com/maps/place//data=!4m3!3m2!1s0x123:0x456!12e1'
    ),
    true
  );
  assert.equal(
    isDirectGoogleReviewUrl('https://search.google.com/local/writereview?placeid=ChIJ123'),
    true
  );
  assert.equal(isDirectGoogleReviewUrl('https://g.page/r/example/review'), true);
  assert.equal(isDirectGoogleReviewUrl('https://maps.google.com/?cid=123'), false);
  assert.equal(
    isDirectGoogleReviewUrl('https://example.com/maps/place//data=!4m3!3m2!1s123!12e1'),
    false
  );
});

test('builds a direct review URL from a Google Maps feature ID', () => {
  assert.equal(
    reviewUrlFromGoogleMapsFeatureId('0x2e69f123:0x456abc'),
    'https://www.google.com/maps/place//data=!4m3!3m2!1s0x2e69f123:0x456abc!12e1'
  );
  assert.equal(reviewUrlFromGoogleMapsFeatureId('not-a-google-feature-id'), null);
});
