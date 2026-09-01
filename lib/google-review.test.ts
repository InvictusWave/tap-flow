import assert from 'node:assert/strict';
import test from 'node:test';
// @ts-expect-error Node's native TypeScript loader requires the file extension.
import { isDirectGoogleReviewUrl } from './google-review.ts';

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
