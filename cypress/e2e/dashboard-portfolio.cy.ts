describe('Dashboard & Portfolio Management', () => {
  beforeEach(() => {
    // Login before each test
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('test@agentvault.com');
    cy.get('[data-testid="password-input"]').type('TestPassword123!');
    cy.get('[data-testid="login-submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Dashboard Overview', () => {
    it('should display dashboard with key metrics', () => {
      cy.visit('/dashboard');
      
      // Verify main dashboard elements
      cy.get('[data-testid="dashboard-stats"]').should('be.visible');
      cy.get('[data-testid="portfolio-chart"]').should('be.visible');
      cy.get('[data-testid="agent-management"]').should('be.visible');
      cy.get('[data-testid="recent-activity"]').should('be.visible');
      
      // Check key metrics
      cy.get('[data-testid="total-portfolio-value"]').should('be.visible');
      cy.get('[data-testid="24h-change"]').should('be.visible');
      cy.get('[data-testid="active-agents"]').should('be.visible');
      cy.get('[data-testid="active-trades"]').should('be.visible');
    });

    it('should show real-time portfolio updates', () => {
      cy.visit('/dashboard');
      
      // Mock real-time updates
      cy.intercept('GET', '**/api/portfolio', { fixture: 'portfolio.json' }).as('portfolioUpdate');
      
      // Wait for initial load
      cy.wait('@portfolioUpdate');
      
      // Verify portfolio value is displayed
      cy.get('[data-testid="total-portfolio-value"]').should('contain.text', '$15,420.75');
      cy.get('[data-testid="24h-change"]').should('contain.text', '+$245.50');
    });

    it('should display agent performance summary', () => {
      cy.visit('/dashboard');
      
      // Verify agent performance section
      cy.get('[data-testid="agent-performance-summary"]').should('be.visible');
      cy.get('[data-testid="agent-performance-item"]').should('have.length.greaterThan', 0);
      
      // Check performance metrics
      cy.get('[data-testid="agent-win-rate"]').should('be.visible');
      cy.get('[data-testid="agent-total-return"]').should('be.visible');
      cy.get('[data-testid="agent-total-trades"]').should('be.visible');
    });

    it('should show recent trading activity', () => {
      cy.visit('/dashboard');
      
      // Verify recent activity section
      cy.get('[data-testid="recent-activity"]').should('be.visible');
      cy.get('[data-testid="activity-item"]').should('have.length.greaterThan', 0);
      
      // Check activity details
      cy.get('[data-testid="activity-time"]').should('be.visible');
      cy.get('[data-testid="activity-action"]').should('be.visible');
      cy.get('[data-testid="activity-agent"]').should('be.visible');
      cy.get('[data-testid="activity-value"]').should('be.visible');
    });

    it('should handle responsive dashboard layout', () => {
      // Test mobile layout
      cy.viewport(375, 667);
      cy.visit('/dashboard');
      cy.get('[data-testid="dashboard-stats"]').should('be.visible');
      
      // Test tablet layout
      cy.viewport(768, 1024);
      cy.get('[data-testid="dashboard-stats"]').should('be.visible');
      
      // Test desktop layout
      cy.viewport(1280, 720);
      cy.get('[data-testid="dashboard-stats"]').should('be.visible');
    });
  });

  describe('Portfolio Management', () => {
    it('should display portfolio overview', () => {
      cy.visit('/portfolio');
      
      // Verify portfolio page elements
      cy.get('[data-testid="portfolio-overview"]').should('be.visible');
      cy.get('[data-testid="portfolio-stats"]').should('be.visible');
      cy.get('[data-testid="portfolio-chart"]').should('be.visible');
      cy.get('[data-testid="asset-allocation"]').should('be.visible');
      
      // Check portfolio statistics
      cy.get('[data-testid="total-value"]').should('be.visible');
      cy.get('[data-testid="total-change-24h"]').should('be.visible');
      cy.get('[data-testid="total-change-percentage"]').should('be.visible');
      cy.get('[data-testid="total-assets"]').should('be.visible');
    });

    it('should show asset allocation breakdown', () => {
      cy.visit('/portfolio');
      
      // Verify asset allocation
      cy.get('[data-testid="asset-item"]').should('have.length.greaterThan', 0);
      
      // Check asset details
      cy.get('[data-testid="asset-symbol"]').should('be.visible');
      cy.get('[data-testid="asset-name"]').should('be.visible');
      cy.get('[data-testid="asset-balance"]').should('be.visible');
      cy.get('[data-testid="asset-balance-usd"]').should('be.visible');
      cy.get('[data-testid="asset-allocation-percentage"]').should('be.visible');
    });

    it('should display portfolio performance chart', () => {
      cy.visit('/portfolio');
      
      // Verify chart elements
      cy.get('[data-testid="portfolio-chart"]').should('be.visible');
      cy.get('[data-testid="chart-timeframe-selector"]').should('be.visible');
      
      // Test different timeframes
      cy.get('[data-testid="timeframe-1d"]').click();
      cy.get('[data-testid="portfolio-chart"]').should('be.visible');
      
      cy.get('[data-testid="timeframe-1w"]').click();
      cy.get('[data-testid="portfolio-chart"]').should('be.visible');
      
      cy.get('[data-testid="timeframe-1m"]').click();
      cy.get('[data-testid="portfolio-chart"]').should('be.visible');
      
      cy.get('[data-testid="timeframe-1y"]').click();
      cy.get('[data-testid="portfolio-chart"]').should('be.visible');
    });

    it('should show portfolio performance metrics', () => {
      cy.visit('/portfolio');
      cy.get('[data-testid="performance-metrics-tab"]').click();
      
      // Verify performance metrics
      cy.get('[data-testid="sharpe-ratio"]').should('be.visible');
      cy.get('[data-testid="max-drawdown"]').should('be.visible');
      cy.get('[data-testid="volatility"]').should('be.visible');
      cy.get('[data-testid="alpha"]').should('be.visible');
      cy.get('[data-testid="beta"]').should('be.visible');
      cy.get('[data-testid="calmar-ratio"]').should('be.visible');
    });

    it('should display trading history', () => {
      cy.visit('/portfolio');
      cy.get('[data-testid="trading-history-tab"]').click();
      
      // Verify trading history table
      cy.get('[data-testid="trades-table"]').should('be.visible');
      cy.get('[data-testid="trade-row"]').should('have.length.greaterThan', 0);
      
      // Check trade details
      cy.get('[data-testid="trade-date"]').should('be.visible');
      cy.get('[data-testid="trade-type"]').should('be.visible');
      cy.get('[data-testid="trade-pair"]').should('be.visible');
      cy.get('[data-testid="trade-amount"]').should('be.visible');
      cy.get('[data-testid="trade-price"]').should('be.visible');
      cy.get('[data-testid="trade-value"]').should('be.visible');
      cy.get('[data-testid="trade-agent"]').should('be.visible');
    });

    it('should filter trading history', () => {
      cy.visit('/portfolio');
      cy.get('[data-testid="trading-history-tab"]').click();
      
      // Filter by trade type
      cy.get('[data-testid="trade-type-filter"]').select('BUY');
      cy.get('[data-testid="trade-row"]').each(($row) => {
        cy.wrap($row).find('[data-testid="trade-type"]').should('contain.text', 'BUY');
      });
      
      // Filter by date range
      cy.get('[data-testid="date-from"]').type('2025-01-01');
      cy.get('[data-testid="date-to"]').type('2025-01-31');
      cy.get('[data-testid="apply-date-filter"]').click();
      
      cy.get('[data-testid="trade-row"]').should('have.length.greaterThan', 0);
    });

    it('should export portfolio data', () => {
      cy.visit('/portfolio');
      cy.get('[data-testid="export-tab"]').click();
      
      // Export portfolio snapshot
      cy.get('[data-testid="export-portfolio"]').click();
      cy.get('[data-testid="export-format-csv"]').click();
      cy.get('[data-testid="confirm-export"]').click();
      
      // Verify download
      cy.readFile('cypress/downloads/portfolio-snapshot.csv').should('exist');
      
      // Export trading history
      cy.get('[data-testid="export-trades"]').click();
      cy.get('[data-testid="export-format-csv"]').click();
      cy.get('[data-testid="confirm-export"]').click();
      
      // Verify download
      cy.readFile('cypress/downloads/trading-history.csv').should('exist');
    });
  });

  describe('Market Data Integration', () => {
    it('should display real-time market data', () => {
      cy.visit('/dashboard');
      
      // Verify market data section
      cy.get('[data-testid="market-data"]').should('be.visible');
      cy.get('[data-testid="market-price"]').should('contain.text', '$');
      cy.get('[data-testid="market-change"]').should('be.visible');
      
      // Check multiple assets
      cy.get('[data-testid="market-item"]').should('have.length.greaterThan', 0);
    });

    it('should show market trends', () => {
      cy.visit('/portfolio');
      cy.get('[data-testid="market-trends-tab"]').click();
      
      // Verify market trends
      cy.get('[data-testid="market-trend-chart"]').should('be.visible');
      cy.get('[data-testid="trend-indicator"]').should('be.visible');
    });

    it('should handle market data updates', () => {
      cy.visit('/dashboard');
      
      // Mock market data update
      cy.intercept('GET', '**/api/market/overview', { fixture: 'market-data.json' }).as('marketUpdate');
      
      // Trigger refresh
      cy.get('[data-testid="refresh-market-data"]').click();
      cy.wait('@marketUpdate');
      
      // Verify updated data
      cy.get('[data-testid="market-data"]').should('be.visible');
    });
  });

  describe('Alerts and Notifications', () => {
    it('should display system alerts', () => {
      cy.visit('/dashboard');
      
      // Verify alerts section
      cy.get('[data-testid="alerts-section"]').should('be.visible');
      cy.get('[data-testid="alert-item"]').should('have.length.greaterThan', 0);
      
      // Check alert details
      cy.get('[data-testid="alert-type"]').should('be.visible');
      cy.get('[data-testid="alert-message"]').should('be.visible');
      cy.get('[data-testid="alert-severity"]').should('be.visible');
    });

    it('should handle alert dismissal', () => {
      cy.visit('/dashboard');
      
      // Dismiss alert
      cy.get('[data-testid="alert-item"]').first().within(() => {
        cy.get('[data-testid="dismiss-alert"]').click();
      });
      
      // Verify alert is removed
      cy.get('[data-testid="alert-item"]').should('have.length', 0);
    });

    it('should show notification preferences', () => {
      cy.visit('/settings');
      cy.get('[data-testid="notifications-tab"]').click();
      
      // Verify notification settings
      cy.get('[data-testid="email-notifications"]').should('be.visible');
      cy.get('[data-testid="trade-alerts"]').should('be.visible');
      cy.get('[data-testid="portfolio-alerts"]').should('be.visible');
      cy.get('[data-testid="market-alerts"]').should('be.visible');
    });
  });

  describe('Performance Analytics', () => {
    it('should display performance analytics', () => {
      cy.visit('/analytics');
      
      // Verify analytics dashboard
      cy.get('[data-testid="analytics-dashboard"]').should('be.visible');
      cy.get('[data-testid="performance-metrics"]').should('be.visible');
      cy.get('[data-testid="risk-metrics"]').should('be.visible');
      cy.get('[data-testid="trading-metrics"]').should('be.visible');
    });

    it('should show performance comparison', () => {
      cy.visit('/analytics');
      cy.get('[data-testid="comparison-tab"]').click();
      
      // Verify comparison charts
      cy.get('[data-testid="benchmark-comparison"]').should('be.visible');
      cy.get('[data-testid="peer-comparison"]').should('be.visible');
    });

    it('should display risk analysis', () => {
      cy.visit('/analytics');
      cy.get('[data-testid="risk-analysis-tab"]').click();
      
      // Verify risk metrics
      cy.get('[data-testid="var-chart"]').should('be.visible');
      cy.get('[data-testid="drawdown-analysis"]').should('be.visible');
      cy.get('[data-testid="correlation-matrix"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle portfolio loading errors', () => {
      // Mock portfolio loading error
      cy.intercept('GET', '**/api/portfolio', {
        statusCode: 500,
        body: { success: false, error: 'Failed to load portfolio' }
      }).as('portfolioError');
      
      cy.visit('/portfolio');
      cy.wait('@portfolioError');
      
      cy.get('[data-testid="error-message"]').should('contain.text', 'Failed to load portfolio');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });

    it('should handle market data errors', () => {
      // Mock market data error
      cy.intercept('GET', '**/api/market/overview', {
        statusCode: 500,
        body: { success: false, error: 'Failed to load market data' }
      }).as('marketDataError');
      
      cy.visit('/dashboard');
      cy.wait('@marketDataError');
      
      cy.get('[data-testid="market-data-error"]').should('contain.text', 'Failed to load market data');
    });

    it('should handle network connectivity issues', () => {
      // Mock network error
      cy.intercept('GET', '**/api/**', { forceNetworkError: true }).as('networkError');
      
      cy.visit('/dashboard');
      cy.wait('@networkError');
      
      cy.get('[data-testid="network-error"]').should('contain.text', 'Network error');
      cy.get('[data-testid="retry-button"]').should('be.visible');
    });
  });

  describe('Data Refresh and Updates', () => {
    it('should auto-refresh portfolio data', () => {
      cy.visit('/portfolio');
      
      // Mock periodic updates
      cy.intercept('GET', '**/api/portfolio', { fixture: 'portfolio.json' }).as('portfolioRefresh');
      
      // Wait for auto-refresh (every 30 seconds)
      cy.wait(30000);
      cy.wait('@portfolioRefresh');
      
      // Verify data is updated
      cy.get('[data-testid="total-value"]').should('be.visible');
    });

    it('should handle manual refresh', () => {
      cy.visit('/portfolio');
      
      // Mock refresh
      cy.intercept('GET', '**/api/portfolio', { fixture: 'portfolio.json' }).as('manualRefresh');
      
      cy.get('[data-testid="refresh-button"]').click();
      cy.wait('@manualRefresh');
      
      // Verify refresh indicator
      cy.get('[data-testid="refresh-indicator"]').should('be.visible');
      cy.get('[data-testid="refresh-indicator"]').should('not.exist');
    });
  });
}); 