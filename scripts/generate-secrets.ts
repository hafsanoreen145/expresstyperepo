#!/usr/bin/env node

/**
 * Utility script to generate secure secrets for .env file
 * Usage: npx ts-node scripts/generate-secrets.ts
 */

import crypto from 'crypto';

function generateSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

console.log('🔐 Generating Secure Secrets\n');

const secrets = {
  SESSION_SECRET: generateSecret(32),
  JWT_SECRET: generateSecret(32),
  OAUTH_STATE_SECRET: generateSecret(16),
};

console.log('Copy these values to your .env file:\n');
console.log('SESSION_SECRET=' + secrets.SESSION_SECRET);
console.log('JWT_SECRET=' + secrets.JWT_SECRET);
console.log('');
console.log('⚠️  Keep these values secure and never commit to version control!');
