#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Generate a secure random string
function generateSecret(length = 64) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}

// Generate secrets
const secrets = {
  JWT_SECRET: generateSecret(64),
  REFRESH_TOKEN_SECRET: generateSecret(64),
  WEBHOOK_SECRET: generateSecret(48),
  SESSION_SECRET: generateSecret(48),
  ENCRYPTION_KEY: generateSecret(32), // 256 bits for AES-256
};

// Create a .env.local file with the generated secrets
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';

// Add existing .env content if it exists
if (fs.existsSync(envPath)) {
  const existingContent = fs.readFileSync(envPath, 'utf8');
  const lines = existingContent.split('\n');
  
  // Keep only lines that don't contain our generated secrets
  const filteredLines = lines.filter(line => 
    !Object.keys(secrets).some(key => line.startsWith(`${key}=`))
  );
  
  envContent = filteredLines.join('\n');
}

// Add generated secrets
for (const [key, value] of Object.entries(secrets)) {
  envContent += `\n${key}=${value}`;
}

// Write to .env.local
fs.writeFileSync(envPath, envContent.trim());

console.log('✅ Generated secure secrets in .env.local');
console.log('🔒 Please keep this file secure and never commit it to version control!');

// Also output to console for easy copying
console.log('\nGenerated secrets:');
for (const [key, value] of Object.entries(secrets)) {
  console.log(`${key}=${value}`);
}
