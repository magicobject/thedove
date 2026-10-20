import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeEmail, readableEmail, emailLinkHtml, emailButtonHtml } from '../scripts/obfuscate-email.mjs';

test('encodeEmail round-trips and does not contain the address', () => {
  const address = 'vicar@kingtonparishes.org.uk';
  const encoded = encodeEmail(address);
  assert.ok(!encoded.includes('@') && !encoded.includes('vicar'));
  const decoded = Buffer.from(encoded, 'base64').toString('utf8').split('').reverse().join('');
  assert.equal(decoded, address);
});

test('the link html has only the readable "[at]" fallback, never the address', () => {
  const html = emailLinkHtml('vicar@kingtonparishes.org.uk');
  assert.ok(!html.includes('@'));
  assert.ok(html.includes(readableEmail('vicar@kingtonparishes.org.uk')));
  assert.ok(!html.includes('mailto:'));
});

test('the button html carries the subject/body as plain data attributes, never the address', () => {
  const html = emailButtonHtml('vicar@kingtonparishes.org.uk', 'Email Sally Welch', {
    subject: 'Getting involved with The Dove',
    body: 'Hi Sally',
  });
  assert.ok(!html.includes('@'));
  assert.ok(!html.includes('mailto:'));
  assert.ok(html.includes('data-subject="Getting involved with The Dove"'));
  assert.ok(html.includes('data-body="Hi Sally"'));
  assert.ok(html.includes('data-label="Email Sally Welch"'));
});

test('the button html HTML-escapes attribute values', () => {
  const html = emailButtonHtml('vicar@kingtonparishes.org.uk', 'Email "Sally" & Welch', { subject: 'A & B' });
  assert.ok(html.includes('data-label="Email &quot;Sally&quot; &amp; Welch"'));
  assert.ok(html.includes('data-subject="A &amp; B"'));
});
