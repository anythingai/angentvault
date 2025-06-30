#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log('🚀 AgentVault Environment Setup\n');
  console.log('This script will help you configure your .env file for the hackathon.\n');

  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env file already exists. Overwrite? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setup cancelled.');
      process.exit(0);
    }
  }

  // Read .env.example
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  let envContent = envExample;

  console.log('\n📋 Basic Configuration\n');

  // Generate secure secrets
  const jwtSecret = crypto.randomBytes(32).toString('hex');
  const sessionSecret = crypto.randomBytes(32).toString('hex');
  const webhookSecret = crypto.randomBytes(32).toString('hex');

  envContent = envContent.replace('your-super-secret-jwt-key-change-in-production', jwtSecret);
  envContent = envContent.replace('your-session-secret-change-this-in-production', sessionSecret);
  envContent = envContent.replace('YOUR_WEBHOOK_SECRET', webhookSecret);

  console.log('✅ Generated secure secrets');

  // Ask for CDP credentials
  console.log('\n🔐 Coinbase Developer Platform (CDP) Configuration\n');
  console.log('Get your CDP API credentials from: https://portal.cdp.coinbase.com/\n');

  const cdpApiKey = await question('CDP API Key ID (press Enter for demo mode): ');
  const cdpPrivateKey = await question('CDP Private Key (press Enter for demo mode): ');

  if (cdpApiKey && cdpPrivateKey) {
    envContent = envContent.replace('YOUR_CDP_API_KEY', cdpApiKey);
    envContent = envContent.replace('YOUR_CDP_PRIVATE_KEY', cdpPrivateKey);
    console.log('✅ CDP credentials configured');
  } else {
    console.log('⚠️  CDP running in demo mode');
  }

  // Ask for AWS credentials
  console.log('\n☁️  AWS Bedrock Configuration\n');
  console.log('Get your AWS credentials from: https://console.aws.amazon.com/iam/\n');

  const awsAccessKey = await question('AWS Access Key ID (press Enter for demo mode): ');
  const awsSecretKey = await question('AWS Secret Access Key (press Enter for demo mode): ');

  if (awsAccessKey && awsSecretKey) {
    envContent = envContent.replace('YOUR_AWS_ACCESS_KEY_ID', awsAccessKey);
    envContent = envContent.replace('YOUR_AWS_SECRET_ACCESS_KEY', awsSecretKey);
    console.log('✅ AWS credentials configured');
  } else {
    console.log('⚠️  Bedrock running in demo mode');
  }

  // Ask for Pinata credentials
  console.log('\n📌 Pinata IPFS Configuration\n');
  console.log('Get your Pinata JWT from: https://app.pinata.cloud/developers/api-keys\n');

  const pinataJwt = await question('Pinata JWT (press Enter for demo mode): ');

  if (pinataJwt) {
    envContent = envContent.replace('YOUR_PINATA_JWT', pinataJwt);
    envContent = envContent.replace('YOUR_PINATA_API_KEY', 'configured');
    envContent = envContent.replace('YOUR_PINATA_SECRET_API_KEY', 'configured');
    console.log('✅ Pinata credentials configured');
  } else {
    console.log('⚠️  Pinata running in demo mode');
  }

  // Ask for x402pay configuration
  console.log('\n💳 x402pay Configuration\n');
  console.log('Learn about x402pay at: https://x402.org/\n');

  const x402ApiKey = await question('x402pay API Key (press Enter to use defaults): ');
  const x402SecretKey = await question('x402pay Secret Key (press Enter to use defaults): ');

  if (x402ApiKey && x402SecretKey) {
    envContent = envContent.replace('YOUR_X402_PAY_API_KEY', x402ApiKey);
    envContent = envContent.replace('YOUR_X402_PAY_SECRET_KEY', x402SecretKey);
  } else {
    // Use default test values
    envContent = envContent.replace('YOUR_X402_PAY_API_KEY', 'test-api-key');
    envContent = envContent.replace('YOUR_X402_PAY_SECRET_KEY', 'test-secret-key');
  }

  // Write .env file
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ Environment configuration saved to .env');

  // Create .env.local for Next.js
  const envLocalPath = path.join(__dirname, '..', '.env.local');
  const envLocalContent = `NEXT_PUBLIC_API_URL=http://localhost:4000\n`;
  fs.writeFileSync(envLocalPath, envLocalContent);
  console.log('✅ Created .env.local for Next.js');

  console.log('\n🎉 Setup complete! Next steps:');
  console.log('1. Run: npm install');
  console.log('2. Run: npm run db:push');
  console.log('3. Run: npm run dev');
  console.log('\nFor production deployment, update the credentials in your .env file.');

  rl.close();
}

setupEnvironment().catch(console.error); 