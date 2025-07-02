const { exec } = require('child_process');

// console.log('🚀 Starting AgentVault - Autonomous AI Trading Platform');
// console.log('========================================================================');

// Start the Next.js frontend
// console.log('📦 Starting Next.js Frontend on http://localhost:3000...');
const frontend = exec('npm run dev', { cwd: __dirname });

frontend.stdout.on('data', (data) => {
  process.stdout.write(`[FRONTEND] ${data}`);
});

frontend.stderr.on('data', (data) => {
  process.stderr.write(`[FRONTEND] ${data}`);
});

frontend.on('close', (_code) => {
  // console.log(`Frontend process exited with code ${code}`);
});

// Wait a bit then show status
setTimeout(() => {
  // console.log('\n🌟 AgentVault is starting up!');
  // console.log('\n📊 Dashboard: http://localhost:3000');
  // console.log('⚡ Features:');
  // console.log('  - Amazon Bedrock Nova AI Integration');
  // console.log('  - x402pay Micropayments');
  // console.log('  - Coinbase CDP Wallet Management');
  // console.log('  - Akash Network Compute');
  // console.log('  - Pinata IPFS Storage');
  // console.log('\n🏆 Production-ready autonomous crypto trading platform');
  // console.log('========================================================================');
}, 3000); 