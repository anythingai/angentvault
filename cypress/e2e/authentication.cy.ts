describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Landing Page', () => {
    it('should display the landing page with proper navigation', () => {
      cy.visit('/');
      
      // Verify main elements are visible
      cy.get('h1').should('contain.text', 'Unleash AI-Powered Crypto Agents');
      cy.get('[data-testid="hero-section"]').should('be.visible');
      cy.get('[data-testid="tech-integrations"]').should('be.visible');
      
      // Verify navigation links
      cy.get('[data-testid="nav-dashboard"]').should('be.visible');
      cy.get('[data-testid="nav-agents"]').should('be.visible');
      cy.get('[data-testid="nav-marketplace"]').should('be.visible');
      cy.get('[data-testid="nav-portfolio"]').should('be.visible');
      
      // Verify call-to-action buttons
      cy.get('[data-testid="cta-get-started"]').should('be.visible');
      cy.get('[data-testid="cta-marketplace"]').should('be.visible');
    });

    it('should handle responsive design correctly', () => {
      cy.viewport(375, 667); // Mobile
      cy.visit('/');
      cy.get('[data-testid="hero-section"]').should('be.visible');
      
      cy.viewport(768, 1024); // Tablet
      cy.get('[data-testid="hero-section"]').should('be.visible');
      
      cy.viewport(1280, 720); // Desktop
      cy.get('[data-testid="hero-section"]').should('be.visible');
    });
  });

  describe('Wallet Authentication', () => {
    it('should connect wallet successfully', () => {
      cy.visit('/login');
      
      // Mock wallet connection
      cy.window().then((win) => {
        win.ethereum = {
          isMetaMask: true,
          request: cy.stub().resolves(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']),
          on: cy.stub(),
          removeListener: cy.stub(),
        };
      });
      
      // Click connect wallet button
      cy.get('[data-testid="connect-wallet"]').click();
      
      // Wait for connection and redirect
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard-stats"]').should('be.visible');
    });

    it('should handle wallet connection failure gracefully', () => {
      cy.visit('/login');
      
      // Mock failed wallet connection
      cy.window().then((win) => {
        win.ethereum = {
          isMetaMask: true,
          request: cy.stub().rejects(new Error('User rejected request')),
          on: cy.stub(),
          removeListener: cy.stub(),
        };
      });
      
      cy.get('[data-testid="connect-wallet"]').click();
      
      // Should show error message
      cy.get('[data-testid="error-message"]').should('contain.text', 'Wallet connection failed');
    });

    it('should support multiple wallet providers', () => {
      cy.visit('/login');
      
      // Test MetaMask
      cy.window().then((win) => {
        win.ethereum = {
          isMetaMask: true,
          request: cy.stub().resolves(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']),
          on: cy.stub(),
          removeListener: cy.stub(),
        };
      });
      
      cy.get('[data-testid="connect-wallet"]').click();
      cy.url().should('include', '/dashboard');
      
      // Test Coinbase Wallet
      cy.visit('/login');
      cy.window().then((win) => {
        win.ethereum = {
          isMetaMask: false,
          isCoinbaseWallet: true,
          request: cy.stub().resolves(['0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6']),
          on: cy.stub(),
          removeListener: cy.stub(),
        };
      });
      
      cy.get('[data-testid="connect-wallet"]').click();
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Email/Password Authentication', () => {
    it('should login with valid credentials', () => {
      cy.visit('/login');
      
      // Fill login form
      cy.get('[data-testid="email-input"]').type('test@agentvault.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="login-submit"]').click();
      
      // Verify successful login
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard-stats"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      
      // Mock failed login
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 401,
        body: { success: false, error: 'Invalid credentials' }
      }).as('failedLogin');
      
      cy.get('[data-testid="email-input"]').type('invalid@email.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-submit"]').click();
      
      cy.wait('@failedLogin');
      cy.get('[data-testid="error-message"]').should('contain.text', 'Invalid credentials');
    });

    it('should validate form inputs', () => {
      cy.visit('/login');
      
      // Test empty email
      cy.get('[data-testid="login-submit"]').click();
      cy.get('[data-testid="email-error"]').should('contain.text', 'Email is required');
      
      // Test invalid email format
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="login-submit"]').click();
      cy.get('[data-testid="email-error"]').should('contain.text', 'Invalid email format');
      
      // Test empty password
      cy.get('[data-testid="email-input"]').clear().type('test@agentvault.com');
      cy.get('[data-testid="login-submit"]').click();
      cy.get('[data-testid="password-error"]').should('contain.text', 'Password is required');
    });
  });

  describe('User Registration', () => {
    it('should register new user successfully', () => {
      cy.visit('/register');
      
      // Fill registration form
      cy.get('[data-testid="name-input"]').type('New Test User');
      cy.get('[data-testid="email-input"]').type('newuser@agentvault.com');
      cy.get('[data-testid="password-input"]').type('SecurePassword123!');
      cy.get('[data-testid="confirm-password-input"]').type('SecurePassword123!');
      cy.get('[data-testid="terms-checkbox"]').check();
      cy.get('[data-testid="register-submit"]').click();
      
      // Verify successful registration
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="dashboard-stats"]').should('be.visible');
    });

    it('should validate registration form', () => {
      cy.visit('/register');
      
      // Test password mismatch
      cy.get('[data-testid="name-input"]').type('Test User');
      cy.get('[data-testid="email-input"]').type('test@agentvault.com');
      cy.get('[data-testid="password-input"]').type('Password123!');
      cy.get('[data-testid="confirm-password-input"]').type('DifferentPassword123!');
      cy.get('[data-testid="register-submit"]').click();
      
      cy.get('[data-testid="password-mismatch-error"]').should('contain.text', 'Passwords do not match');
      
      // Test terms acceptance
      cy.get('[data-testid="confirm-password-input"]').clear().type('Password123!');
      cy.get('[data-testid="register-submit"]').click();
      
      cy.get('[data-testid="terms-error"]').should('contain.text', 'You must accept the terms');
    });

    it('should handle existing email registration', () => {
      cy.visit('/register');
      
      // Mock existing email error
      cy.intercept('POST', '**/api/auth/register', {
        statusCode: 409,
        body: { success: false, error: 'Email already exists' }
      }).as('existingEmail');
      
      cy.get('[data-testid="name-input"]').type('Test User');
      cy.get('[data-testid="email-input"]').type('existing@agentvault.com');
      cy.get('[data-testid="password-input"]').type('Password123!');
      cy.get('[data-testid="confirm-password-input"]').type('Password123!');
      cy.get('[data-testid="terms-checkbox"]').check();
      cy.get('[data-testid="register-submit"]').click();
      
      cy.wait('@existingEmail');
      cy.get('[data-testid="error-message"]').should('contain.text', 'Email already exists');
    });
  });

  describe('Session Management', () => {
    it('should persist authentication state', () => {
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('test@agentvault.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="login-submit"]').click();
      
      // Verify token is stored
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.exist;
      });
      
      // Refresh page and verify still logged in
      cy.reload();
      cy.get('[data-testid="dashboard-stats"]').should('be.visible');
    });

    it('should redirect unauthenticated users', () => {
      // Clear authentication
      cy.clearLocalStorage();
      cy.clearCookies();
      
      // Try to access protected route
      cy.visit('/dashboard');
      cy.url().should('include', '/login');
    });

    it('should handle token expiration', () => {
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('test@agentvault.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="login-submit"]').click();
      
      // Mock expired token response
      cy.intercept('GET', '**/api/portfolio', {
        statusCode: 401,
        body: { success: false, error: 'Token expired' }
      }).as('expiredToken');
      
      cy.visit('/portfolio');
      cy.wait('@expiredToken');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Logout Functionality', () => {
    it('should logout successfully', () => {
      // Login first
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('test@agentvault.com');
      cy.get('[data-testid="password-input"]').type('TestPassword123!');
      cy.get('[data-testid="login-submit"]').click();
      
      // Click logout
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Verify logout
      cy.url().should('include', '/');
      cy.window().then((win) => {
        expect(win.localStorage.getItem('token')).to.be.null;
      });
    });
  });

  describe('Password Reset', () => {
    it('should navigate to forgot password page', () => {
      cy.visit('/login');
      cy.get('[data-testid="forgot-password-link"]').click();
      cy.url().should('include', '/forgot-password');
    });

    it('should handle password reset request', () => {
      cy.visit('/forgot-password');
      
      cy.get('[data-testid="email-input"]').type('test@agentvault.com');
      cy.get('[data-testid="reset-submit"]').click();
      
      cy.get('[data-testid="success-message"]').should('contain.text', 'Password reset email sent');
    });
  });

  describe('Security Features', () => {
    it('should prevent XSS attacks in form inputs', () => {
      cy.visit('/register');
      
      const xssPayload = '<script>alert("xss")</script>';
      cy.get('[data-testid="name-input"]').type(xssPayload);
      
      // Verify input is sanitized
      cy.get('[data-testid="name-input"]').should('not.contain', '<script>');
    });

    it('should implement rate limiting', () => {
      cy.visit('/login');
      
      // Attempt multiple rapid login attempts
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="email-input"]').clear().type(`test${i}@agentvault.com`);
        cy.get('[data-testid="password-input"]').clear().type('wrongpassword');
        cy.get('[data-testid="login-submit"]').click();
      }
      
      // Should show rate limit error
      cy.get('[data-testid="error-message"]').should('contain.text', 'Too many attempts');
    });
  });
}); 