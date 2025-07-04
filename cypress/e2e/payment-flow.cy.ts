describe('Payment Flow & Monetization', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('test@agentvault.com');
    cy.get('[data-testid="password-input"]').type('TestPassword123!');
    cy.get('[data-testid="login-submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('x402pay Integration', () => {
    it('should display payment required for premium features', () => {
      cy.visit('/api/agents/analysis');
      
      // Should receive 402 Payment Required
      cy.intercept('POST', '**/api/agents/analysis', {
        statusCode: 402,
        body: {
          error: 'Payment Required',
          accepts: [
            {
              amount: '0.05',
              currency: 'USDC',
              description: 'AI Market sentiment analysis'
            }
          ]
        }
      }).as('paymentRequired');
      
      cy.wait('@paymentRequired');
      cy.get('[data-testid="payment-required"]').should('be.visible');
      cy.get('[data-testid="payment-amount"]').should('contain.text', '0.05 USDC');
    });

    it('should process micropayment successfully', () => {
      cy.visit('/marketplace');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="subscribe-button"]').click();
      
      // Mock payment processing
      cy.intercept('POST', '**/api/payments/process', {
        statusCode: 200,
        body: {
          success: true,
          paymentId: 'pay_123456789',
          status: 'COMPLETED',
          amount: 0.05,
          currency: 'USDC'
        }
      }).as('paymentProcessed');
      
      cy.get('[data-testid="confirm-payment"]').click();
      cy.wait('@paymentProcessed');
      
      cy.get('[data-testid="payment-success"]').should('be.visible');
      cy.get('[data-testid="payment-id"]').should('contain.text', 'pay_123456789');
    });

    it('should handle payment verification', () => {
      // Mock payment verification
      cy.intercept('GET', '**/api/payments/verify/*', {
        statusCode: 200,
        body: {
          success: true,
          status: 'COMPLETED',
          verified: true
        }
      }).as('paymentVerified');
      
      cy.visit('/payments');
      cy.get('[data-testid="payment-item"]').first().click();
      cy.get('[data-testid="verify-payment"]').click();
      
      cy.wait('@paymentVerified');
      cy.get('[data-testid="verification-status"]').should('contain.text', 'Verified');
    });

    it('should handle payment failures gracefully', () => {
      cy.visit('/marketplace');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="subscribe-button"]').click();
      
      // Mock payment failure
      cy.intercept('POST', '**/api/payments/process', {
        statusCode: 400,
        body: {
          success: false,
          error: 'Insufficient balance'
        }
      }).as('paymentFailed');
      
      cy.get('[data-testid="confirm-payment"]').click();
      cy.wait('@paymentFailed');
      
      cy.get('[data-testid="payment-error"]').should('contain.text', 'Insufficient balance');
      cy.get('[data-testid="retry-payment"]').should('be.visible');
    });
  });

  describe('Revenue Management', () => {
    it('should display revenue dashboard', () => {
      cy.visit('/payments');
      
      // Verify revenue stats
      cy.get('[data-testid="total-revenue"]').should('be.visible');
      cy.get('[data-testid="monthly-revenue"]').should('be.visible');
      cy.get('[data-testid="average-per-query"]').should('be.visible');
      cy.get('[data-testid="total-queries"]').should('be.visible');
    });

    it('should track revenue by agent', () => {
      cy.visit('/payments');
      cy.get('[data-testid="revenue-by-agent-tab"]').click();
      
      // Verify agent revenue breakdown
      cy.get('[data-testid="agent-revenue-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="agent-name"]').should('be.visible');
      cy.get('[data-testid="agent-revenue"]').should('be.visible');
      cy.get('[data-testid="agent-queries"]').should('be.visible');
    });

    it('should show revenue trends', () => {
      cy.visit('/payments');
      cy.get('[data-testid="revenue-trends-tab"]').click();
      
      // Verify revenue charts
      cy.get('[data-testid="revenue-chart"]').should('be.visible');
      cy.get('[data-testid="queries-chart"]').should('be.visible');
      cy.get('[data-testid="average-price-chart"]').should('be.visible');
    });

    it('should export revenue reports', () => {
      cy.visit('/payments');
      cy.get('[data-testid="export-reports-tab"]').click();
      
      // Export monthly report
      cy.get('[data-testid="export-monthly"]').click();
      cy.get('[data-testid="export-format-csv"]').click();
      cy.get('[data-testid="confirm-export"]').click();
      
      // Verify download
      cy.readFile('cypress/downloads/revenue-report.csv').should('exist');
    });
  });

  describe('Transaction History', () => {
    it('should display transaction list', () => {
      cy.visit('/payments');
      cy.get('[data-testid="transactions-tab"]').click();
      
      // Verify transaction table
      cy.get('[data-testid="transactions-table"]').should('be.visible');
      cy.get('[data-testid="transaction-row"]').should('have.length.greaterThan', 0);
      
      // Check transaction details
      cy.get('[data-testid="transaction-id"]').should('be.visible');
      cy.get('[data-testid="transaction-amount"]').should('be.visible');
      cy.get('[data-testid="transaction-status"]').should('be.visible');
      cy.get('[data-testid="transaction-date"]').should('be.visible');
    });

    it('should filter transactions', () => {
      cy.visit('/payments');
      cy.get('[data-testid="transactions-tab"]').click();
      
      // Filter by status
      cy.get('[data-testid="status-filter"]').select('completed');
      cy.get('[data-testid="transaction-row"]').each(($row) => {
        cy.wrap($row).find('[data-testid="transaction-status"]').should('contain.text', 'completed');
      });
      
      // Filter by date range
      cy.get('[data-testid="date-from"]').type('2025-01-01');
      cy.get('[data-testid="date-to"]').type('2025-01-31');
      cy.get('[data-testid="apply-date-filter"]').click();
      
      cy.get('[data-testid="transaction-row"]').should('have.length.greaterThan', 0);
    });

    it('should show transaction details', () => {
      cy.visit('/payments');
      cy.get('[data-testid="transactions-tab"]').click();
      cy.get('[data-testid="transaction-row"]').first().click();
      
      // Verify detailed view
      cy.get('[data-testid="transaction-details"]').should('be.visible');
      cy.get('[data-testid="transaction-hash"]').should('be.visible');
      cy.get('[data-testid="block-number"]').should('be.visible');
      cy.get('[data-testid="gas-used"]').should('be.visible');
      cy.get('[data-testid="network"]').should('be.visible');
    });
  });

  describe('Payment Methods', () => {
    it('should manage payment methods', () => {
      cy.visit('/payments');
      cy.get('[data-testid="payment-methods-tab"]').click();
      
      // Add new payment method
      cy.get('[data-testid="add-payment-method"]').click();
      cy.get('[data-testid="wallet-address"]').type('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6');
      cy.get('[data-testid="payment-method-name"]').type('Test Wallet');
      cy.get('[data-testid="save-payment-method"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Payment method added');
    });

    it('should set default payment method', () => {
      cy.visit('/payments');
      cy.get('[data-testid="payment-methods-tab"]').click();
      
      cy.get('[data-testid="payment-method-item"]').first().within(() => {
        cy.get('[data-testid="set-default"]').click();
      });
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Default payment method updated');
    });

    it('should remove payment method', () => {
      cy.visit('/payments');
      cy.get('[data-testid="payment-methods-tab"]').click();
      
      cy.get('[data-testid="payment-method-item"]').first().within(() => {
        cy.get('[data-testid="remove-payment-method"]').click();
      });
      
      cy.get('[data-testid="confirmation-dialog"]').should('be.visible');
      cy.get('[data-testid="confirm-remove"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Payment method removed');
    });
  });

  describe('Subscription Management', () => {
    it('should subscribe to agent', () => {
      cy.visit('/marketplace');
      cy.get('[data-testid="agent-item"]').first().click();
      
      // Subscribe to agent
      cy.get('[data-testid="subscribe-button"]').click();
      cy.get('[data-testid="subscription-type"]').select('monthly');
      cy.get('[data-testid="confirm-subscription"]').click();
      
      // Mock subscription creation
      cy.intercept('POST', '**/api/subscriptions', {
        statusCode: 200,
        body: {
          success: true,
          subscriptionId: 'sub_123456789',
          status: 'active'
        }
      }).as('subscriptionCreated');
      
      cy.wait('@subscriptionCreated');
      cy.get('[data-testid="subscription-success"]').should('be.visible');
    });

    it('should manage active subscriptions', () => {
      cy.visit('/payments');
      cy.get('[data-testid="subscriptions-tab"]').click();
      
      // Verify subscription list
      cy.get('[data-testid="subscription-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="subscription-status"]').should('be.visible');
      cy.get('[data-testid="subscription-renewal"]').should('be.visible');
    });

    it('should cancel subscription', () => {
      cy.visit('/payments');
      cy.get('[data-testid="subscriptions-tab"]').click();
      
      cy.get('[data-testid="subscription-item"]').first().within(() => {
        cy.get('[data-testid="cancel-subscription"]').click();
      });
      
      cy.get('[data-testid="confirmation-dialog"]').should('be.visible');
      cy.get('[data-testid="confirm-cancel"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Subscription cancelled');
    });
  });

  describe('Pricing Configuration', () => {
    it('should configure agent pricing', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="pricing-tab"]').click();
      
      // Set per-query pricing
      cy.get('[data-testid="pricing-type"]').select('PER_QUERY');
      cy.get('[data-testid="pricing-amount"]').clear().type('0.10');
      cy.get('[data-testid="save-pricing"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Pricing updated');
    });

    it('should set subscription pricing', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="pricing-tab"]').click();
      
      // Set monthly subscription
      cy.get('[data-testid="pricing-type"]').select('MONTHLY');
      cy.get('[data-testid="pricing-amount"]').clear().type('25.00');
      cy.get('[data-testid="save-pricing"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Pricing updated');
    });

    it('should configure dynamic pricing', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="pricing-tab"]').click();
      
      // Enable dynamic pricing
      cy.get('[data-testid="dynamic-pricing-toggle"]').check();
      cy.get('[data-testid="base-price"]').clear().type('0.05');
      cy.get('[data-testid="demand-multiplier"]').clear().type('1.5');
      cy.get('[data-testid="save-pricing"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Dynamic pricing enabled');
    });
  });

  describe('Revenue Sharing', () => {
    it('should configure revenue sharing', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="revenue-sharing-tab"]').click();
      
      // Set revenue sharing percentage
      cy.get('[data-testid="revenue-share-percentage"]').clear().type('20');
      cy.get('[data-testid="partner-wallet"]').type('0x1234567890abcdef1234567890abcdef12345678');
      cy.get('[data-testid="save-revenue-sharing"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Revenue sharing configured');
    });

    it('should track revenue sharing payments', () => {
      cy.visit('/payments');
      cy.get('[data-testid="revenue-sharing-tab"]').click();
      
      // Verify revenue sharing history
      cy.get('[data-testid="revenue-sharing-item"]').should('have.length.greaterThan', 0);
      cy.get('[data-testid="partner-wallet"]').should('be.visible');
      cy.get('[data-testid="shared-amount"]').should('be.visible');
      cy.get('[data-testid="sharing-date"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle payment processing errors', () => {
      cy.visit('/marketplace');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="subscribe-button"]').click();
      
      // Mock network error
      cy.intercept('POST', '**/api/payments/process', { forceNetworkError: true }).as('paymentError');
      
      cy.get('[data-testid="confirm-payment"]').click();
      cy.wait('@paymentError');
      
      cy.get('[data-testid="payment-error"]').should('contain.text', 'Network error');
      cy.get('[data-testid="retry-payment"]').should('be.visible');
    });

    it('should handle insufficient balance', () => {
      cy.visit('/marketplace');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="subscribe-button"]').click();
      
      // Mock insufficient balance
      cy.intercept('POST', '**/api/payments/process', {
        statusCode: 400,
        body: {
          success: false,
          error: 'Insufficient USDC balance'
        }
      }).as('insufficientBalance');
      
      cy.get('[data-testid="confirm-payment"]').click();
      cy.wait('@insufficientBalance');
      
      cy.get('[data-testid="payment-error"]').should('contain.text', 'Insufficient USDC balance');
      cy.get('[data-testid="add-funds-button"]').should('be.visible');
    });

    it('should handle payment timeout', () => {
      cy.visit('/marketplace');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="subscribe-button"]').click();
      
      // Mock timeout
      cy.intercept('POST', '**/api/payments/process', {
        statusCode: 408,
        body: {
          success: false,
          error: 'Payment timeout'
        }
      }).as('paymentTimeout');
      
      cy.get('[data-testid="confirm-payment"]').click();
      cy.wait('@paymentTimeout');
      
      cy.get('[data-testid="payment-error"]').should('contain.text', 'Payment timeout');
      cy.get('[data-testid="retry-payment"]').should('be.visible');
    });
  });

  describe('Security Features', () => {
    it('should validate payment signatures', () => {
      cy.visit('/marketplace');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="subscribe-button"]').click();
      
      // Mock invalid signature
      cy.intercept('POST', '**/api/payments/process', {
        statusCode: 400,
        body: {
          success: false,
          error: 'Invalid payment signature'
        }
      }).as('invalidSignature');
      
      cy.get('[data-testid="confirm-payment"]').click();
      cy.wait('@invalidSignature');
      
      cy.get('[data-testid="payment-error"]').should('contain.text', 'Invalid payment signature');
    });

    it('should prevent double spending', () => {
      cy.visit('/marketplace');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="subscribe-button"]').click();
      
      // Mock double spending attempt
      cy.intercept('POST', '**/api/payments/process', {
        statusCode: 409,
        body: {
          success: false,
          error: 'Payment already processed'
        }
      }).as('doubleSpending');
      
      cy.get('[data-testid="confirm-payment"]').click();
      cy.wait('@doubleSpending');
      
      cy.get('[data-testid="payment-error"]').should('contain.text', 'Payment already processed');
    });
  });
}); 