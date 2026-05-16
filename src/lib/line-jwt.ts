// Minimal LINE id_token verification.
// LINE id_token is signed with HS256 using the channel secret per LINE Login docs:
// https://developers.line.biz/en/docs/line-login/verify-id-token/
// We do a manual HMAC-SHA256 verify so we don't pull in extra deps.

import crypto from 'crypto';

function base64UrlDecode(input: string): Buffer {
  const pad = 4 - (input.length % 4 || 4);
  const b64 = (input + (pad < 4 ? '='.repeat(pad) : '')).replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64');
}

export interface LineIdTokenPayload {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nonce?: string;
  amr?: string[];
  name?: string;
  picture?: string;
  email?: string;
}

export function verifyLineIdToken(idToken: string, channelId: string, channelSecret: string): LineIdTokenPayload {
  const parts = idToken.split('.');
  if (parts.length !== 3) throw new Error('Invalid id_token format');
  const [headerB64, payloadB64, signatureB64] = parts;

  const header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
  if (header.alg !== 'HS256') throw new Error(`Unsupported id_token alg: ${header.alg}`);

  const expectedSig = crypto
    .createHmac('sha256', channelSecret)
    .update(`${headerB64}.${payloadB64}`)
    .digest();

  const providedSig = base64UrlDecode(signatureB64);

  if (expectedSig.length !== providedSig.length || !crypto.timingSafeEqual(expectedSig, providedSig)) {
    throw new Error('id_token signature mismatch');
  }

  const payload: LineIdTokenPayload = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));

  if (payload.iss !== 'https://access.line.me') throw new Error('Invalid id_token issuer');
  if (payload.aud !== channelId) throw new Error('id_token audience mismatch');
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) throw new Error('id_token expired');

  return payload;
}
