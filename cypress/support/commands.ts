/// <reference types="cypress" />

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to connect wallet
       * @example cy.connectWallet('metamask')
       */
      connectWallet(walletType?: string): Chainable<void>;
      
      /**
       * Custom command to create an AI agent
       * @example cy.createAgent({name: 'Test Agent', strategy: 'balanced'})
       */
      createAgent(agentData: any): Chainable<void>;
      
      /**
       * Custom command to process payment
       * @example cy.processPayment(10, 'Test payment')
       */
      processPayment(amount: number, description: string): Chainable<void>;
      
      /**
       * Custom command to verify market data
       * @example cy.verifyMarketData()
       */
      verifyMarketData(): Chainable<void>;
      
      /**
       * Custom command to verify portfolio data
       * @example cy.verifyPortfolio()
       */
      verifyPortfolio(): Chainable<void>;
      
      /**
       * Custom command to verify agent status
       * @example cy.verifyAgentStatus('agent-123', 'ACTIVE')
       */
      verifyAgentStatus(agentId: string, expectedStatus: string): Chainable<void>;
      
      /**
       * Custom command to verify error handling
       * @example cy.verifyErrorHandling('Network error')
       */
      verifyErrorHandling(errorMessage: string): Chainable<void>;
      
      /**
       * Custom command to verify loading state
       * @example cy.verifyLoadingState()
       */
      verifyLoadingState(): Chainable<void>;
      
      /**
       * Custom command to test responsive design
       * @example cy.testResponsive()
       */
      testResponsive(): Chainable<void>;
      
      /**
       * Custom command to simulate network error
       * @example cy.simulateNetworkError()
       */
      simulateNetworkError(): Chainable<void>;
      
      /**
       * Custom command to verify database state
       * @example cy.verifyDatabaseState('users', 5)
       */
      verifyDatabaseState(table: string, expectedCount: number): Chainable<void>;
      
      /**
       * Custom command to measure performance
       * @example cy.measurePerformance('dashboard-load')
       */
      measurePerformance(name: string): Chainable<void>;
      
      /**
       * Custom command to check accessibility
       * @example cy.checkAccessibility()
       */
      checkAccessibility(): Chainable<void>;
    }
  }
}

// Authentication commands
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-submit"]').click();
  cy.url().should('include', '/dashboard');
});

Cypress.Commands.add('register', (userData: any) => {
  cy.visit('/register');
  cy.get('[data-testid="name-input"]').type(userData.name);
  cy.get('[data-testid="email-input"]').type(userData.email);
  cy.get('[data-testid="password-input"]').type(userData.password);
  cy.get('[data-testid="confirm-password-input"]').type(userData.password);
  cy.get('[data-testid="terms-checkbox"]').check();
  cy.get('[data-testid="register-submit"]').click();
  cy.url().should('include', '/dashboard');
});

// Navigation commands
Cypress.Commands.add('navigateTo', (path: string) => {
  cy.visit(path);
  cy.get('[data-testid="main-content"]').should('be.visible');
});

Cypress.Commands.add('navigateToDashboard', () => {
  cy.navigateTo('/dashboard');
  cy.get('[data-testid="dashboard-stats"]').should('be.visible');
});

Cypress.Commands.add('navigateToAgents', () => {
  cy.navigateTo('/agents');
  cy.get('[data-testid="agents-list"]').should('be.visible');
});

Cypress.Commands.add('navigateToPortfolio', () => {
  cy.navigateTo('/portfolio');
  cy.get('[data-testid="portfolio-overview"]').should('be.visible');
});

Cypress.Commands.add('navigateToMarketplace', () => {
  cy.navigateTo('/marketplace');
  cy.get('[data-testid="marketplace-agents"]').should('be.visible');
});

Cypress.Commands.add('navigateToAnalytics', () => {
  cy.navigateTo('/analytics');
  cy.get('[data-testid="analytics-dashboard"]').should('be.visible');
});

Cypress.Commands.add('navigateToPayments', () => {
  cy.navigateTo('/payments');
  cy.get('[data-testid="payments-overview"]').should('be.visible');
});

Cypress.Commands.add('navigateToSettings', () => {
  cy.navigateTo('/settings');
  cy.get('[data-testid="settings-form"]').should('be.visible');
});

// Data verification commands
Cypress.Commands.add('verifyUserData', (expectedData: any) => {
  cy.get('[data-testid="user-name"]').should('contain.text', expectedData.name);
  cy.get('[data-testid="user-email"]').should('contain.text', expectedData.email);
  cy.get('[data-testid="user-wallet"]').should('contain.text', expectedData.walletAddress.slice(0, 6));
});

Cypress.Commands.add('verifyAgentData', (agentId: string, expectedData: any) => {
  cy.get(`[data-testid="agent-${agentId}-name"]`).should('contain.text', expectedData.name);
  cy.get(`[data-testid="agent-${agentId}-status"]`).should('contain.text', expectedData.status);
  cy.get(`[data-testid="agent-${agentId}-performance"]`).should('be.visible');
});

Cypress.Commands.add('verifyTransactionData', (transactionId: string, expectedData: any) => {
  cy.get(`[data-testid="transaction-${transactionId}-amount"]`).should('contain.text', expectedData.amount);
  cy.get(`[data-testid="transaction-${transactionId}-status"]`).should('contain.text', expectedData.status);
  cy.get(`[data-testid="transaction-${transactionId}-date"]`).should('be.visible');
});

// Form interaction commands
Cypress.Commands.add('fillAgentForm', (agentData: any) => {
  cy.get('[data-testid="agent-name"]').clear().type(agentData.name);
  cy.get('[data-testid="agent-description"]').clear().type(agentData.description);
  cy.get('[data-testid="strategy-type"]').select(agentData.strategy);
  cy.get('[data-testid="timeframe"]').select(agentData.timeframe);
  cy.get('[data-testid="max-trade-size"]').clear().type(agentData.maxTradeSize.toString());
  cy.get('[data-testid="stop-loss"]').clear().type(agentData.stopLoss.toString());
  cy.get('[data-testid="take-profit"]').clear().type(agentData.takeProfit.toString());
  cy.get('[data-testid="max-daily-loss"]').clear().type(agentData.maxDailyLoss.toString());
  cy.get('[data-testid="max-open-positions"]').clear().type(agentData.maxOpenPositions.toString());
});

Cypress.Commands.add('fillPaymentForm', (paymentData: any) => {
  cy.get('[data-testid="payment-amount"]').clear().type(paymentData.amount.toString());
  cy.get('[data-testid="payment-description"]').clear().type(paymentData.description);
  cy.get('[data-testid="payment-method"]').select(paymentData.method);
});

Cypress.Commands.add('fillSettingsForm', (settingsData: any) => {
  cy.get('[data-testid="display-name"]').clear().type(settingsData.name);
  cy.get('[data-testid="email-address"]').clear().type(settingsData.email);
  cy.get('[data-testid="email-notifications"]').check(settingsData.emailNotifications);
  cy.get('[data-testid="auto-compound"]').check(settingsData.autoCompound);
});

// API interaction commands
Cypress.Commands.add('mockApiResponse', (method: string, url: string, response: any) => {
  cy.intercept(method, url, response).as(`${method.toLowerCase()}-${url.replace(/[^a-zA-Z0-9]/g, '-')}`);
});

Cypress.Commands.add('waitForApiCall', (alias: string) => {
  cy.wait(`@${alias}`);
});

Cypress.Commands.add('verifyApiResponse', (alias: string, expectedData: any) => {
  cy.wait(`@${alias}`).then((interception) => {
    expect(interception.response?.body).to.deep.include(expectedData);
  });
});

// Utility commands
Cypress.Commands.add('clearTestData', () => {
  cy.task('clearTestData');
});

Cypress.Commands.add('seedTestData', (data: any) => {
  cy.task('seedTestData', data);
});

Cypress.Commands.add('takeScreenshot', (name: string) => {
  cy.document().should('exist');
  cy.screenshot(name);
});

Cypress.Commands.add('logPerformance', (name: string) => {
  cy.window().then((win) => {
    const performance = win.performance;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    cy.log(`Performance - ${name}:`, {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    });
  });
});

// Export for use in other files
export {}; 