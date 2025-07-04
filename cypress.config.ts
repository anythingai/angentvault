import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
        cleanupTestData() {
          // Clean up test data after each test
          // This is a placeholder - implement actual cleanup logic as needed
          console.log('Cleaning up test data...');
          return null;
        },
        resetMocks() {
          // Reset mocks after each test
          // This is a placeholder - implement actual mock reset logic as needed
          console.log('Resetting mocks...');
          return null;
        },
      });
    },
    env: {
      // Environment variables for testing
      apiUrl: 'http://localhost:4000',
      testUser: {
        email: 'test@agentvault.com',
        password: 'TestPassword123!',
        walletAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'
      },
      demoMode: true
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    downloadsFolder: 'cypress/downloads',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    // Retry failed tests
    retries: {
      runMode: 2,
      openMode: 0
    },
    // Parallel execution settings
    experimentalRunAllSpecs: true,
    // Performance monitoring
    experimentalModifyObstructiveThirdPartyCode: true
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
}); 