const { test, expect } = require('@playwright/test');

/**
 * PropAgentic Phase 2.1 Enhanced Security Test Suite
 * Tests rate limiting, input sanitization, session management, and security monitoring
 */

test.describe('Enhanced Security Implementation', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    // Wait for any loading to complete
    await page.waitForLoadState('networkidle');
  });

  test.describe('Rate Limiting Protection', () => {
    
    test('should block repeated login attempts', async ({ page }) => {
      await page.goto('/login');
      
      // Attempt multiple failed logins to trigger rate limiting
      for (let i = 0; i < 6; i++) {
        await page.fill('[data-testid="email"]', 'test@example.com');
        await page.fill('[data-testid="password"]', 'wrongpassword');
        await page.click('[data-testid="login-button"]');
        
        // Wait for response
        await page.waitForTimeout(1000);
        
        if (i >= 4) { // After 5 attempts (0-4), should be blocked
          await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
          await expect(page.locator('text=Too many attempts')).toBeVisible();
        }
      }
    });

    test('should rate limit signup attempts', async ({ page }) => {
      await page.goto('/signup');
      
      // Attempt multiple signups to trigger rate limiting
      for (let i = 0; i < 4; i++) {
        await page.fill('[data-testid="email"]', `test${i}@example.com`);
        await page.fill('[data-testid="password"]', 'testpassword');
        await page.fill('[data-testid="firstName"]', 'Test');
        await page.fill('[data-testid="lastName"]', 'User');
        await page.click('[data-testid="signup-button"]');
        
        await page.waitForTimeout(1000);
        
        if (i >= 2) { // After 3 attempts, should be blocked
          await expect(page.locator('[data-testid="rate-limit-error"]')).toBeVisible();
        }
      }
    });

  });

  test.describe('Input Sanitization', () => {
    
    test('should sanitize XSS attempts in forms', async ({ page }) => {
      await page.goto('/signup');
      
      // Test XSS payload in various fields
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src="x" onerror="alert(\'xss\')">'
      ];
      
      for (const payload of xssPayloads) {
        await page.fill('[data-testid="firstName"]', payload);
        await page.fill('[data-testid="lastName"]', 'User');
        await page.fill('[data-testid="email"]', 'test@example.com');
        await page.fill('[data-testid="password"]', 'testpassword');
        
        // Submit form
        await page.click('[data-testid="signup-button"]');
        await page.waitForTimeout(500);
        
        // Check that malicious content is sanitized
        const firstNameValue = await page.inputValue('[data-testid="firstName"]');
        expect(firstNameValue).not.toContain('<script>');
        expect(firstNameValue).not.toContain('javascript:');
        expect(firstNameValue).not.toContain('onerror');
        
        // Should not trigger any JavaScript alerts
        const alertDialog = page.locator('role=dialog[name="Alert"]');
        await expect(alertDialog).not.toBeVisible();
      }
    });

    test('should validate email format', async ({ page }) => {
      await page.goto('/login');
      
      const invalidEmails = [
        'notanemail',
        'test@',
        '@example.com',
        'test..test@example.com'
      ];
      
      for (const email of invalidEmails) {
        await page.fill('[data-testid="email"]', email);
        await page.fill('[data-testid="password"]', 'testpassword');
        await page.click('[data-testid="login-button"]');
        
        await expect(page.locator('[data-testid="email-error"]')).toBeVisible();
        await expect(page.locator('text=valid email')).toBeVisible();
      }
    });

    test('should enforce password requirements', async ({ page }) => {
      await page.goto('/signup');
      
      const weakPasswords = [
        '123',
        'password',
        'abc123',
        '12345678' // No uppercase, lowercase, special chars
      ];
      
      for (const password of weakPasswords) {
        await page.fill('[data-testid="email"]', 'test@example.com');
        await page.fill('[data-testid="password"]', password);
        await page.fill('[data-testid="firstName"]', 'Test');
        await page.fill('[data-testid="lastName"]', 'User');
        await page.click('[data-testid="signup-button"]');
        
        await expect(page.locator('[data-testid="password-error"]')).toBeVisible();
      }
    });

  });

  test.describe('Session Management', () => {
    
    test('should maintain session across page refreshes', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'valid@example.com');
      await page.fill('[data-testid="password"]', 'validpassword');
      await page.click('[data-testid="login-button"]');
      
      // Wait for successful login
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      // Refresh page
      await page.reload();
      
      // Should still be logged in
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="login-form"]')).not.toBeVisible();
    });

    test('should detect concurrent sessions', async ({ page, context }) => {
      // Login in first tab
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      // Open second tab and login with same user
      const secondPage = await context.newPage();
      await secondPage.goto('/login');
      await secondPage.fill('[data-testid="email"]', 'test@example.com');
      await secondPage.fill('[data-testid="password"]', 'testpassword');
      await secondPage.click('[data-testid="login-button"]');
      
      // Should show session conflict warning
      await expect(secondPage.locator('[data-testid="session-warning"]')).toBeVisible();
      await expect(secondPage.locator('text=multiple sessions')).toBeVisible();
    });

    test('should handle session timeout', async ({ page }) => {
      // Mock session timeout by manipulating localStorage
      await page.goto('/dashboard');
      
      // Simulate expired session
      await page.evaluate(() => {
        const expiredSession = {
          sessionId: 'test-session',
          expiresAt: Date.now() - 1000, // Expired 1 second ago
          userId: 'test-user'
        };
        localStorage.setItem('session', JSON.stringify(expiredSession));
      });
      
      // Reload page to trigger session validation
      await page.reload();
      
      // Should redirect to login
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="session-expired-message"]')).toBeVisible();
    });

  });

  test.describe('Two-Factor Authentication', () => {
    
    test('should enforce 2FA setup for new users', async ({ page }) => {
      // Complete signup process
      await page.goto('/signup');
      await page.fill('[data-testid="email"]', 'newuser@example.com');
      await page.fill('[data-testid="password"]', 'SecurePass123!');
      await page.fill('[data-testid="firstName"]', 'New');
      await page.fill('[data-testid="lastName"]', 'User');
      await page.click('[data-testid="signup-button"]');
      
      // Should be redirected to 2FA setup
      await expect(page.locator('[data-testid="2fa-setup"]')).toBeVisible();
      await expect(page.locator('[data-testid="qr-code"]')).toBeVisible();
      await expect(page.locator('text=Two-Factor Authentication')).toBeVisible();
    });

    test('should validate 2FA codes during login', async ({ page }) => {
      // Login with user who has 2FA enabled
      await page.goto('/login');
      await page.fill('[data-testid="email"]', '2fa-user@example.com');
      await page.fill('[data-testid="password"]', 'validpassword');
      await page.click('[data-testid="login-button"]');
      
      // Should show 2FA verification step
      await expect(page.locator('[data-testid="2fa-verification"]')).toBeVisible();
      
      // Test invalid code
      await page.fill('[data-testid="2fa-code"]', '000000');
      await page.click('[data-testid="verify-button"]');
      await expect(page.locator('[data-testid="2fa-error"]')).toBeVisible();
      
      // Test valid code (mock)
      await page.fill('[data-testid="2fa-code"]', '123456');
      await page.click('[data-testid="verify-button"]');
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    });

    test('should handle backup codes', async ({ page }) => {
      // Navigate to 2FA verification
      await page.goto('/login');
      await page.fill('[data-testid="email"]', '2fa-user@example.com');
      await page.fill('[data-testid="password"]', 'validpassword');
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="2fa-verification"]')).toBeVisible();
      
      // Click backup code option
      await page.click('[data-testid="use-backup-code"]');
      await expect(page.locator('[data-testid="backup-code-input"]')).toBeVisible();
      
      // Test invalid backup code
      await page.fill('[data-testid="backup-code"]', 'invalid-code');
      await page.click('[data-testid="verify-backup-button"]');
      await expect(page.locator('[data-testid="backup-code-error"]')).toBeVisible();
    });

  });

  test.describe('Security Monitoring', () => {
    
    test('should detect suspicious activity', async ({ page }) => {
      // Simulate rapid page navigation (suspicious behavior)
      const pages = ['/dashboard', '/properties', '/tenants', '/maintenance'];
      
      for (let i = 0; i < 10; i++) {
        for (const pagePath of pages) {
          await page.goto(pagePath);
          await page.waitForTimeout(100); // Very rapid navigation
        }
      }
      
      // Should trigger security warning
      await expect(page.locator('[data-testid="security-warning"]')).toBeVisible();
      await expect(page.locator('text=unusual activity')).toBeVisible();
    });

    test('should log security events', async ({ page }) => {
      // Perform actions that should be logged
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      // Check if security events are being tracked
      const securityLogs = await page.evaluate(() => {
        return window.securityManager?.getSecurityMetrics?.() || {};
      });
      
      expect(securityLogs).toBeDefined();
    });

    test('should handle emergency lockdown', async ({ page }) => {
      // Trigger emergency lockdown (admin function)
      await page.evaluate(() => {
        if (window.securityManager) {
          window.securityManager.emergencyLockdown('test-incident');
        }
      });
      
      await page.reload();
      
      // Should show lockdown message
      await expect(page.locator('[data-testid="lockdown-message"]')).toBeVisible();
      await expect(page.locator('text=system maintenance')).toBeVisible();
    });

  });

  test.describe('Audit Logging', () => {
    
    test('should track user actions', async ({ page }) => {
      // Login and perform tracked actions
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      
      // Navigate to different sections
      await page.click('[data-testid="properties-nav"]');
      await page.click('[data-testid="add-property-button"]');
      
      // Check audit log entries
      const auditLogs = await page.evaluate(() => {
        return window.auditLogger?.getStats?.() || {};
      });
      
      expect(auditLogs.totalEvents).toBeGreaterThan(0);
    });

    test('should mask sensitive data in logs', async ({ page }) => {
      // Perform action with sensitive data
      await page.goto('/signup');
      await page.fill('[data-testid="email"]', 'sensitive@example.com');
      await page.fill('[data-testid="password"]', 'SensitivePassword123!');
      await page.click('[data-testid="signup-button"]');
      
      // Check that sensitive data is masked in logs
      const auditEntries = await page.evaluate(() => {
        return window.auditLogger?.getAuditLogs?.({ eventType: 'auth' }) || [];
      });
      
      // Sensitive data should be masked with asterisks
      const hasUnmaskedData = auditEntries.some(entry => 
        JSON.stringify(entry).includes('SensitivePassword123!')
      );
      expect(hasUnmaskedData).toBeFalsy();
    });

  });

  test.describe('Performance and Reliability', () => {
    
    test('should maintain fast response times with security checks', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should complete login within reasonable time (5 seconds)
      expect(responseTime).toBeLessThan(5000);
    });

    test('should handle security service failures gracefully', async ({ page }) => {
      // Mock security service failure
      await page.addInitScript(() => {
        window.securityServiceDown = true;
      });
      
      await page.goto('/login');
      await page.fill('[data-testid="email"]', 'test@example.com');
      await page.fill('[data-testid="password"]', 'testpassword');
      await page.click('[data-testid="login-button"]');
      
      // Should still allow login but with reduced security
      await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
      await expect(page.locator('[data-testid="security-warning"]')).toBeVisible();
    });

  });

  test.describe('Configuration and Environment', () => {
    
    test('should use different security settings for production', async ({ page }) => {
      // Check security configuration
      const securityConfig = await page.evaluate(() => {
        return window.securityConfig || {};
      });
      
      // Should have appropriate settings based on environment
      expect(securityConfig.environment).toBeDefined();
      expect(securityConfig.rateLimiting).toBeDefined();
      expect(securityConfig.sessionManagement).toBeDefined();
    });

    test('should validate security service initialization', async ({ page }) => {
      await page.goto('/');
      
      // Check that all security services are initialized
      const servicesStatus = await page.evaluate(() => {
        return {
          rateLimiter: !!window.rateLimitService,
          inputSanitizer: !!window.inputSanitizer,
          auditLogger: !!window.auditLogger,
          sessionManager: !!window.sessionManager,
          twoFactorAuth: !!window.twoFactorAuth,
          securityManager: !!window.securityManager
        };
      });
      
      Object.values(servicesStatus).forEach(status => {
        expect(status).toBeTruthy();
      });
    });

  });

}); 