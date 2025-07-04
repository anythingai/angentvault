describe('Agent Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('test@agentvault.com');
    cy.get('[data-testid="password-input"]').type('TestPassword123!');
    cy.get('[data-testid="login-submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Agent Creation', () => {
    it('should navigate to agent creation page', () => {
      cy.visit('/agents');
      cy.get('[data-testid="create-agent-button"]').click();
      cy.url().should('include', '/agents/create');
      cy.get('[data-testid="agent-creation-form"]').should('be.visible');
    });

    it('should create a new agent successfully', () => {
      cy.visit('/agents/create');
      
      const agentData = {
        name: 'Test Trading Agent',
        description: 'A test agent for automated trading',
        strategy: 'balanced',
        timeframe: '1h',
        maxTradeSize: 500,
        stopLoss: 5,
        takeProfit: 10,
        maxDailyLoss: 20,
        maxOpenPositions: 3
      };
      
      // Fill agent form
      cy.get('[data-testid="agent-name"]').type(agentData.name);
      cy.get('[data-testid="agent-description"]').type(agentData.description);
      cy.get('[data-testid="strategy-type"]').select(agentData.strategy);
      cy.get('[data-testid="timeframe"]').select(agentData.timeframe);
      cy.get('[data-testid="max-trade-size"]').type(agentData.maxTradeSize.toString());
      cy.get('[data-testid="stop-loss"]').type(agentData.stopLoss.toString());
      cy.get('[data-testid="take-profit"]').type(agentData.takeProfit.toString());
      cy.get('[data-testid="max-daily-loss"]').type(agentData.maxDailyLoss.toString());
      cy.get('[data-testid="max-open-positions"]').type(agentData.maxOpenPositions.toString());
      
      // Submit form
      cy.get('[data-testid="create-agent-submit"]').click();
      
      // Verify success
      cy.url().should('include', '/agents/');
      cy.get('[data-testid="agent-details"]').should('be.visible');
      cy.get('[data-testid="agent-name"]').should('contain.text', agentData.name);
    });

    it('should validate agent creation form', () => {
      cy.visit('/agents/create');
      
      // Test required fields
      cy.get('[data-testid="create-agent-submit"]').click();
      cy.get('[data-testid="name-error"]').should('contain.text', 'Name is required');
      
      // Test invalid trade size
      cy.get('[data-testid="agent-name"]').type('Test Agent');
      cy.get('[data-testid="max-trade-size"]').type('0');
      cy.get('[data-testid="create-agent-submit"]').click();
      cy.get('[data-testid="trade-size-error"]').should('contain.text', 'Trade size must be greater than 0');
      
      // Test invalid stop loss
      cy.get('[data-testid="max-trade-size"]').clear().type('100');
      cy.get('[data-testid="stop-loss"]').type('101');
      cy.get('[data-testid="create-agent-submit"]').click();
      cy.get('[data-testid="stop-loss-error"]').should('contain.text', 'Stop loss must be between 1 and 50');
    });

    it('should handle strategy configuration', () => {
      cy.visit('/agents/create');
      
      // Test conservative strategy
      cy.get('[data-testid="strategy-type"]').select('conservative');
      cy.get('[data-testid="risk-level-indicator"]').should('contain.text', 'Low Risk');
      
      // Test aggressive strategy
      cy.get('[data-testid="strategy-type"]').select('aggressive');
      cy.get('[data-testid="risk-level-indicator"]').should('contain.text', 'High Risk');
      
      // Test balanced strategy
      cy.get('[data-testid="strategy-type"]').select('balanced');
      cy.get('[data-testid="risk-level-indicator"]').should('contain.text', 'Medium Risk');
    });

    it('should preview agent configuration', () => {
      cy.visit('/agents/create');
      
      // Fill form
      cy.get('[data-testid="agent-name"]').type('Preview Test Agent');
      cy.get('[data-testid="agent-description"]').type('Testing preview functionality');
      cy.get('[data-testid="strategy-type"]').select('balanced');
      cy.get('[data-testid="max-trade-size"]').type('1000');
      
      // Check preview
      cy.get('[data-testid="preview-button"]').click();
      cy.get('[data-testid="agent-preview"]').should('be.visible');
      cy.get('[data-testid="preview-name"]').should('contain.text', 'Preview Test Agent');
      cy.get('[data-testid="preview-strategy"]').should('contain.text', 'Balanced');
    });
  });

  describe('Agent Configuration', () => {
    it('should edit existing agent', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="edit-agent-button"]').click();
      
      // Modify agent settings
      cy.get('[data-testid="agent-name"]').clear().type('Updated Agent Name');
      cy.get('[data-testid="max-trade-size"]').clear().type('750');
      cy.get('[data-testid="save-changes-button"]').click();
      
      // Verify changes
      cy.get('[data-testid="success-message"]').should('contain.text', 'Agent updated successfully');
      cy.get('[data-testid="agent-name"]').should('contain.text', 'Updated Agent Name');
    });

    it('should configure risk parameters', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="risk-settings-tab"]').click();
      
      // Update risk parameters
      cy.get('[data-testid="stop-loss"]').clear().type('3');
      cy.get('[data-testid="take-profit"]').clear().type('8');
      cy.get('[data-testid="max-daily-loss"]').clear().type('15');
      cy.get('[data-testid="save-risk-settings"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Risk settings updated');
    });

    it('should configure trading strategy', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="strategy-tab"]').click();
      
      // Select indicators
      cy.get('[data-testid="indicator-rsi"]').check();
      cy.get('[data-testid="indicator-macd"]').check();
      cy.get('[data-testid="indicator-bollinger"]').check();
      
      // Set timeframe
      cy.get('[data-testid="timeframe-select"]').select('4h');
      
      cy.get('[data-testid="save-strategy"]').click();
      cy.get('[data-testid="success-message"]').should('contain.text', 'Strategy updated');
    });

    it('should set spending limits', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="limits-tab"]').click();
      
      // Set daily spending limit
      cy.get('[data-testid="daily-limit"]').clear().type('1000');
      
      // Set weekly spending limit
      cy.get('[data-testid="weekly-limit"]').clear().type('5000');
      
      // Set monthly spending limit
      cy.get('[data-testid="monthly-limit"]').clear().type('20000');
      
      cy.get('[data-testid="save-limits"]').click();
      cy.get('[data-testid="success-message"]').should('contain.text', 'Spending limits updated');
    });
  });

  describe('Agent Monitoring', () => {
    it('should display agent status and performance', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      
      // Verify status display
      cy.get('[data-testid="agent-status"]').should('be.visible');
      cy.get('[data-testid="agent-performance"]').should('be.visible');
      
      // Check performance metrics
      cy.get('[data-testid="total-return"]').should('be.visible');
      cy.get('[data-testid="win-rate"]').should('be.visible');
      cy.get('[data-testid="total-trades"]').should('be.visible');
    });

    it('should show real-time agent activity', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="activity-tab"]').click();
      
      // Verify activity feed
      cy.get('[data-testid="activity-feed"]').should('be.visible');
      cy.get('[data-testid="activity-item"]').should('have.length.greaterThan', 0);
    });

    it('should display trading history', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="trades-tab"]').click();
      
      // Verify trades table
      cy.get('[data-testid="trades-table"]').should('be.visible');
      cy.get('[data-testid="trade-row"]').should('have.length.greaterThan', 0);
      
      // Check trade details
      cy.get('[data-testid="trade-type"]').should('be.visible');
      cy.get('[data-testid="trade-amount"]').should('be.visible');
      cy.get('[data-testid="trade-status"]').should('be.visible');
    });

    it('should show performance charts', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="performance-tab"]').click();
      
      // Verify charts are rendered
      cy.get('[data-testid="performance-chart"]').should('be.visible');
      cy.get('[data-testid="equity-curve"]').should('be.visible');
      cy.get('[data-testid="drawdown-chart"]').should('be.visible');
    });
  });

  describe('Agent Control', () => {
    it('should start and stop agent', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      
      // Start agent
      cy.get('[data-testid="start-agent-button"]').click();
      cy.get('[data-testid="agent-status"]').should('contain.text', 'ACTIVE');
      
      // Stop agent
      cy.get('[data-testid="stop-agent-button"]').click();
      cy.get('[data-testid="agent-status"]').should('contain.text', 'PAUSED');
    });

    it('should pause and resume agent', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      
      // Pause agent
      cy.get('[data-testid="pause-agent-button"]').click();
      cy.get('[data-testid="agent-status"]').should('contain.text', 'PAUSED');
      
      // Resume agent
      cy.get('[data-testid="resume-agent-button"]').click();
      cy.get('[data-testid="agent-status"]').should('contain.text', 'ACTIVE');
    });

    it('should handle emergency stop', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      
      // Emergency stop
      cy.get('[data-testid="emergency-stop-button"]').click();
      cy.get('[data-testid="confirmation-dialog"]').should('be.visible');
      cy.get('[data-testid="confirm-emergency-stop"]').click();
      
      cy.get('[data-testid="agent-status"]').should('contain.text', 'STOPPED');
      cy.get('[data-testid="emergency-stop-notice"]').should('be.visible');
    });

    it('should reset agent to initial state', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="settings-tab"]').click();
      
      // Reset agent
      cy.get('[data-testid="reset-agent-button"]').click();
      cy.get('[data-testid="confirmation-dialog"]').should('be.visible');
      cy.get('[data-testid="confirm-reset"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Agent reset successfully');
    });
  });

  describe('Agent Analytics', () => {
    it('should display comprehensive analytics', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="analytics-tab"]').click();
      
      // Verify analytics sections
      cy.get('[data-testid="performance-metrics"]').should('be.visible');
      cy.get('[data-testid="risk-metrics"]').should('be.visible');
      cy.get('[data-testid="trading-metrics"]').should('be.visible');
      
      // Check specific metrics
      cy.get('[data-testid="sharpe-ratio"]').should('be.visible');
      cy.get('[data-testid="max-drawdown"]').should('be.visible');
      cy.get('[data-testid="profit-factor"]').should('be.visible');
      cy.get('[data-testid="avg-trade-duration"]').should('be.visible');
    });

    it('should show performance comparison', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="analytics-tab"]').click();
      cy.get('[data-testid="comparison-section"]').click();
      
      // Verify comparison charts
      cy.get('[data-testid="benchmark-comparison"]').should('be.visible');
      cy.get('[data-testid="peer-comparison"]').should('be.visible');
    });

    it('should export agent data', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="analytics-tab"]').click();
      
      // Export trading history
      cy.get('[data-testid="export-trades"]').click();
      cy.get('[data-testid="export-format-csv"]').click();
      cy.get('[data-testid="confirm-export"]').click();
      
      // Verify download
      cy.readFile('cypress/downloads/agent-trades.csv').should('exist');
    });
  });

  describe('Agent Marketplace Integration', () => {
    it('should publish agent to marketplace', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="marketplace-tab"]').click();
      
      // Configure marketplace settings
      cy.get('[data-testid="publish-to-marketplace"]').click();
      cy.get('[data-testid="pricing-type"]').select('PER_QUERY');
      cy.get('[data-testid="pricing-amount"]').type('0.05');
      cy.get('[data-testid="agent-description"]').type('Professional trading agent for marketplace');
      cy.get('[data-testid="agent-tags"]').type('bitcoin,momentum,professional');
      
      cy.get('[data-testid="publish-agent"]').click();
      cy.get('[data-testid="success-message"]').should('contain.text', 'Agent published to marketplace');
    });

    it('should manage marketplace listings', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="marketplace-tab"]').click();
      
      // Update pricing
      cy.get('[data-testid="edit-pricing"]').click();
      cy.get('[data-testid="pricing-amount"]').clear().type('0.10');
      cy.get('[data-testid="save-pricing"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Pricing updated');
      
      // View marketplace stats
      cy.get('[data-testid="marketplace-stats"]').should('be.visible');
      cy.get('[data-testid="total-queries"]').should('be.visible');
      cy.get('[data-testid="total-revenue"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle agent creation failure', () => {
      cy.visit('/agents/create');
      
      // Mock API failure
      cy.intercept('POST', '**/api/agents', {
        statusCode: 500,
        body: { success: false, error: 'Failed to create agent' }
      }).as('createAgentFailure');
      
      cy.get('[data-testid="agent-name"]').type('Test Agent');
      cy.get('[data-testid="create-agent-submit"]').click();
      
      cy.wait('@createAgentFailure');
      cy.get('[data-testid="error-message"]').should('contain.text', 'Failed to create agent');
    });

    it('should handle agent update failure', () => {
      cy.visit('/agents');
      cy.get('[data-testid="agent-item"]').first().click();
      cy.get('[data-testid="edit-agent-button"]').click();
      
      // Mock API failure
      cy.intercept('PUT', '**/api/agents/**', {
        statusCode: 500,
        body: { success: false, error: 'Failed to update agent' }
      }).as('updateAgentFailure');
      
      cy.get('[data-testid="agent-name"]').clear().type('Updated Name');
      cy.get('[data-testid="save-changes-button"]').click();
      
      cy.wait('@updateAgentFailure');
      cy.get('[data-testid="error-message"]').should('contain.text', 'Failed to update agent');
    });

    it('should handle network errors gracefully', () => {
      cy.visit('/agents');
      
      // Mock network error
      cy.intercept('GET', '**/api/agents', { forceNetworkError: true }).as('networkError');
      cy.reload();
      
      cy.wait('@networkError');
      cy.get('[data-testid="error-message"]').should('contain.text', 'Failed to load agents');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Performance Testing', () => {
    it('should load agent list quickly', () => {
      cy.visit('/agents');
      
      // Measure load time
      cy.window().then((win) => {
        const startTime = win.performance.now();
        
        cy.get('[data-testid="agents-list"]').should('be.visible').then(() => {
          const endTime = win.performance.now();
          const loadTime = endTime - startTime;
          
          expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
        });
      });
    });

    it('should handle large number of agents', () => {
      // Mock large dataset
      cy.intercept('GET', '**/api/agents', { fixture: 'large-agents-list.json' }).as('largeAgentsList');
      
      cy.visit('/agents');
      cy.wait('@largeAgentsList');
      
      // Verify pagination works
      cy.get('[data-testid="pagination"]').should('be.visible');
      cy.get('[data-testid="agent-item"]').should('have.length', 10); // Default page size
    });
  });
}); 