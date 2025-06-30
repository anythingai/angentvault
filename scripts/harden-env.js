const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '..', '.env');

try {
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Generate secure secrets
  const jwtSecret = crypto.randomBytes(32).toString('base64');
  const sessionSecret = crypto.randomBytes(32).toString('base64');
  const webhookSecret = crypto.randomBytes(32).toString('base64');

  // Replace placeholder secrets
  envContent = envContent.replace(/^JWT_SECRET=.*/m, `JWT_SECRET=${jwtSecret}`);
  envContent = envContent.replace(/^SESSION_SECRET=.*/m, `SESSION_SECRET=${sessionSecret}`);
  envContent = envContent.replace(/^X402_PAY_WEBHOOK_SECRET=.*/m, `X402_PAY_WEBHOOK_SECRET=${webhookSecret}`);

  // Update database configuration
  envContent = envContent.replace(/^DATABASE_PROVIDER=.*/m, 'DATABASE_PROVIDER=postgres');
  envContent = envContent.replace(/^DATABASE_URL=.*/m, 'DATABASE_URL=postgresql://agentvault:StrongPass!@localhost:5432/agentvault');

  fs.writeFileSync(envPath, envContent);

  console.log('✅ .env file has been updated with production-ready secrets and database configuration.');
  console.log('Secrets for JWT, Session, and Webhook have been securely generated.');
  console.log('Database is now configured to use PostgreSQL.');

} catch (error) {
  console.error('❌ Failed to update .env file:', error);
  process.exit(1);
} 