// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
beforeEach(() => {
  // Clear all storage before each test
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Reset any mocked data
  cy.fixture('auth-login.json').as('authData');
  cy.fixture('agents.json').as('agentsData');
  cy.fixture('portfolio.json').as('portfolioData');
  cy.fixture('market-data.json').as('marketData');
});

// Handle uncaught exceptions from the application
Cypress.on('uncaught:exception', (err, _runnable) => {
  // Returning false here prevents Cypress from failing the test
  // for uncaught exceptions that are expected in our app
  
  // Ignore Next.js hydration errors (common in development)
  if (err.message.includes('Hydration failed because the initial UI does not match what was rendered on the server')) {
    return false;
  }
  
  // Ignore Next.js hydration errors (alternative format)
  if (err.message.includes('There was an error while hydrating')) {
    return false;
  }
  
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection')) {
    return false;
  }
  return true;
});

// Performance monitoring
Cypress.on('test:after:run', (attributes) => {
  // Log test performance metrics
  cy.task('log', `Test "${attributes.title}" completed in ${attributes.duration}ms`);
});

// Custom assertions
chai.Assertion.addMethod('containText', function(text: string) {
  const obj = this._obj;
  this.assert(
    obj.text().includes(text),
    `expected #{this} to contain text '${text}'`,
    `expected #{this} to not contain text '${text}'`,
    text,
    obj.text()
  );
});

// Global test data helpers
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with test credentials
       * @example cy.login()
       */
      login(): Chainable<void>;
      
      /**
       * Custom command to create a test agent
       * @example cy.createAgent({name: 'Test Agent'})
       */
      createAgent(agentData: any): Chainable<void>;
      
      /**
       * Custom command to make a test payment
       * @example cy.makePayment({amount: 0.05, currency: 'USDC'})
       */
      makePayment(paymentData: any): Chainable<void>;
      
      /**
       * Custom command to wait for API response
       * @example cy.waitForApi('GET', '/api/portfolio')
       */
      waitForApi(method: string, url: string): Chainable<void>;
      
      /**
       * Custom command to check if element is visible and clickable
       * @example cy.shouldBeClickable('[data-testid="submit-button"]')
       */
      shouldBeClickable(selector: string): Chainable<void>;
      
      /**
       * Custom command to verify wallet connection
       * @example cy.connectWallet()
       */
      connectWallet(): Chainable<void>;
      
      /**
       * Custom command to mock external API calls
       * @example cy.mockExternalApi('GET', 'https://api.coingecko.com/api/v3/simple/price', {bitcoin: {usd: 50000}})
       */
      mockExternalApi(method: string, url: string, response: any): Chainable<void>;
    }
  }
}

// Accessibility testing
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

// Wallet connection simulation
Cypress.Commands.add('connectWallet', (walletType = 'metamask') => {
  cy.window().then((win) => {
    // Mock wallet connection
    win.ethereum = {
      isMetaMask: walletType === 'metamask',
      request: cy.stub().resolves(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']),
      on: cy.stub(),
      removeListener: cy.stub(),
    };
    
    // Trigger wallet connection event
    cy.get('[data-testid="connect-wallet"]').click();
    cy.wait(1000); // Wait for connection to complete
  });
});

// AI agent interaction simulation
Cypress.Commands.add('createAgent', (agentData: any) => {
  cy.intercept('POST', '**/api/agents', { fixture: 'agent-created.json' }).as('createAgent');
  
  cy.visit('/agents/create');
  cy.get('[data-testid="agent-name"]').type(agentData.name);
  cy.get('[data-testid="agent-description"]').type(agentData.description);
  cy.get('[data-testid="strategy-type"]').select(agentData.strategy);
  cy.get('[data-testid="max-trade-size"]').type(agentData.maxTradeSize.toString());
  cy.get('[data-testid="stop-loss"]').type(agentData.stopLoss.toString());
  cy.get('[data-testid="take-profit"]').type(agentData.takeProfit.toString());
  cy.get('[data-testid="create-agent-submit"]').click();
  
  cy.wait('@createAgent');
});

// Payment flow simulation
Cypress.Commands.add('processPayment', (amount: number, description: string) => {
  cy.intercept('POST', '**/api/payments/process', { fixture: 'payment-processed.json' }).as('processPayment');
  
  cy.get('[data-testid="payment-amount"]').type(amount.toString());
  cy.get('[data-testid="payment-description"]').type(description);
  cy.get('[data-testid="payment-submit"]').click();
  
  cy.wait('@processPayment');
});

// Market data verification
Cypress.Commands.add('verifyMarketData', () => {
  cy.get('[data-testid="market-data"]').should('be.visible');
  cy.get('[data-testid="market-price"]').should('contain.text', '$');
  cy.get('[data-testid="market-change"]').should('be.visible');
});

// Portfolio data verification
Cypress.Commands.add('verifyPortfolio', () => {
  cy.get('[data-testid="portfolio-value"]').should('be.visible');
  cy.get('[data-testid="portfolio-change"]').should('be.visible');
  cy.get('[data-testid="portfolio-assets"]').should('have.length.greaterThan', 0);
});

// Agent status verification
Cypress.Commands.add('verifyAgentStatus', (agentId: string, expectedStatus: string) => {
  cy.get(`[data-testid="agent-${agentId}-status"]`).should('contain.text', expectedStatus);
});

// Error handling verification
Cypress.Commands.add('verifyErrorHandling', (errorMessage: string) => {
  cy.get('[data-testid="error-message"]').should('contain.text', errorMessage);
  cy.get('[data-testid="error-retry"]').should('be.visible');
});

// Loading state verification
Cypress.Commands.add('verifyLoadingState', () => {
  cy.get('[data-testid="loading-spinner"]').should('be.visible');
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
});

// Responsive design testing
Cypress.Commands.add('testResponsive', () => {
  const viewports = [
    { width: 375, height: 667, device: 'mobile' },
    { width: 768, height: 1024, device: 'tablet' },
    { width: 1280, height: 720, device: 'desktop' },
    { width: 1920, height: 1080, device: 'large-desktop' }
  ];
  
  viewports.forEach(({ width, height, device }) => {
    cy.viewport(width, height);
    cy.log(`Testing responsive design on ${device} (${width}x${height})`);
    
    // Verify key elements are visible and properly sized
    cy.get('[data-testid="navbar"]').should('be.visible');
    cy.get('[data-testid="main-content"]').should('be.visible');
    
    // Take screenshot for visual regression testing
    cy.screenshot(`responsive-${device}`);
  });
});

// Network error simulation
Cypress.Commands.add('simulateNetworkError', () => {
  cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkError');
  cy.visit('/dashboard');
  cy.wait('@networkError');
});

// Database state verification
Cypress.Commands.add('verifyDatabaseState', (table: string, expectedCount: number) => {
  cy.task('queryDatabase', `SELECT COUNT(*) as count FROM ${table}`).then((result: any) => {
    expect(result.count).to.equal(expectedCount);
  });
});

// Cleanup after tests
afterEach(() => {
  // Clean up any test data
  cy.task('cleanupTestData');
  
  // Reset any mocked services
  cy.task('resetMocks');
}); 