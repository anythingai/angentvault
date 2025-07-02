/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  
  // SWC compiler options
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Disable problematic features
  experimental: {},
  
  // API routes configuration  
  async rewrites() {
    return [];
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Image optimization
  images: {
    domains: ['localhost', 'cdn.coinbase.com', 'assets.coingecko.com'],
  },
  
  // Webpack configuration
  webpack: (config, { _dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Fix for RainbowKit build issues
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Handle ESM modules properly
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };

    // Skip problematic files during build
    config.module.rules.push({
      test: /HeartbeatWorker/,
      type: 'javascript/auto',
    });

    return config;
  },
};

module.exports = nextConfig; 