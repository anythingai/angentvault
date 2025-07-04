// ***********************************************************
// This example support/component.ts is processed and
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

// Global configuration for component tests
beforeEach(() => {
  // Mock external dependencies for component tests
  cy.intercept('GET', '**/api/**', { fixture: 'mock-data.json' }).as('apiCall');
  
  // Mock wallet connection
  cy.window().then((win) => {
    win.ethereum = {
      isMetaMask: true,
      request: cy.stub().resolves(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']),
      on: cy.stub(),
      removeListener: cy.stub(),
    };
  });
});

// Component-specific commands
Cypress.Commands.add('mount', (component: any, options = {}) => {
  return cy.mount(component, {
    ...options,
    providers: {
      ...options.providers,
    },
  });
});

// Export for use in other files
export {}; 