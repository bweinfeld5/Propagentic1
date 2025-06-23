/**
 * Accessibility Testing Suite for WCAG 2.1 AA Compliance
 * PropAgentic Design System
 */

import { a11yTestUtils } from '../../design-system/accessibility';

// ==============================================
// AUTOMATED ACCESSIBILITY TESTS
// ==============================================

/**
 * Comprehensive accessibility audit runner
 */
class AccessibilityTestSuite {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      info: []
    };
  }

  // Clear previous results
  clearResults() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      info: []
    };
  }

  // Add result to appropriate category
  addResult(category, test, message, elements = []) {
    this.results[category].push({
      test,
      message,
      elements,
      timestamp: Date.now()
    });
  }

  // Test 1: Check for missing alt text on images
  testImageAltText() {
    const images = document.querySelectorAll('img');
    const missingAlt = [];
    const decorativeImages = [];

    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      const ariaHidden = img.getAttribute('aria-hidden');

      if (alt === null && role !== 'presentation' && ariaHidden !== 'true') {
        missingAlt.push(img);
      } else if (alt === '' && role !== 'presentation') {
        decorativeImages.push(img);
      }
    });

    if (missingAlt.length === 0) {
      this.addResult('passed', 'Image Alt Text', 'All images have appropriate alt text');
    } else {
      this.addResult('failed', 'Image Alt Text', 
        `${missingAlt.length} images missing alt text`, missingAlt);
    }

    if (decorativeImages.length > 0) {
      this.addResult('info', 'Decorative Images', 
        `${decorativeImages.length} images marked as decorative`, decorativeImages);
    }
  }

  // Test 2: Check form label associations
  testFormLabels() {
    const inputs = document.querySelectorAll('input, select, textarea');
    const unlabeled = [];

    inputs.forEach(input => {
      const type = input.getAttribute('type');
      
      // Skip hidden inputs
      if (type === 'hidden') return;

      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);

      if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
        unlabeled.push(input);
      }
    });

    if (unlabeled.length === 0) {
      this.addResult('passed', 'Form Labels', 'All form inputs are properly labeled');
    } else {
      this.addResult('failed', 'Form Labels', 
        `${unlabeled.length} form inputs missing labels`, unlabeled);
    }
  }

  // Test 3: Check heading hierarchy
  testHeadingHierarchy() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const issues = [];
    let previousLevel = 0;
    let hasH1 = false;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (level === 1) hasH1 = true;
      
      if (index === 0 && level !== 1) {
        issues.push({
          element: heading,
          issue: 'First heading should be h1',
          severity: 'warning'
        });
      }
      
      if (level > previousLevel + 1) {
        issues.push({
          element: heading,
          issue: `Heading level jumps from h${previousLevel} to h${level}`,
          severity: 'failed'
        });
      }
      
      previousLevel = level;
    });

    if (!hasH1 && headings.length > 0) {
      issues.push({
        element: null,
        issue: 'Page missing h1 heading',
        severity: 'failed'
      });
    }

    if (issues.length === 0) {
      this.addResult('passed', 'Heading Hierarchy', 'Heading hierarchy is proper');
    } else {
      const failedIssues = issues.filter(i => i.severity === 'failed');
      const warningIssues = issues.filter(i => i.severity === 'warning');
      
      if (failedIssues.length > 0) {
        this.addResult('failed', 'Heading Hierarchy', 
          `${failedIssues.length} heading hierarchy errors`, 
          failedIssues.map(i => i.element).filter(Boolean));
      }
      
      if (warningIssues.length > 0) {
        this.addResult('warnings', 'Heading Hierarchy', 
          `${warningIssues.length} heading hierarchy warnings`, 
          warningIssues.map(i => i.element).filter(Boolean));
      }
    }
  }

  // Test 4: Check for proper ARIA usage
  testAriaUsage() {
    const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
    const issues = [];

    elementsWithAria.forEach(element => {
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const ariaDescribedBy = element.getAttribute('aria-describedby');
      const role = element.getAttribute('role');

      // Check if aria-labelledby references exist
      if (ariaLabelledBy) {
        const ids = ariaLabelledBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            issues.push({
              element,
              issue: `aria-labelledby references non-existent ID: ${id}`
            });
          }
        });
      }

      // Check if aria-describedby references exist
      if (ariaDescribedBy) {
        const ids = ariaDescribedBy.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            issues.push({
              element,
              issue: `aria-describedby references non-existent ID: ${id}`
            });
          }
        });
      }

      // Check for invalid role values (basic check)
      if (role) {
        const validRoles = [
          'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
          'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
          'contentinfo', 'dialog', 'directory', 'document', 'feed', 'figure',
          'form', 'grid', 'gridcell', 'group', 'heading', 'img', 'link',
          'list', 'listbox', 'listitem', 'log', 'main', 'marquee', 'math',
          'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
          'navigation', 'none', 'note', 'option', 'presentation', 'progressbar',
          'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
          'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton',
          'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel', 'term',
          'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
          'treeitem'
        ];

        if (!validRoles.includes(role)) {
          issues.push({
            element,
            issue: `Invalid ARIA role: ${role}`
          });
        }
      }
    });

    if (issues.length === 0) {
      this.addResult('passed', 'ARIA Usage', 'ARIA attributes are properly used');
    } else {
      this.addResult('failed', 'ARIA Usage', 
        `${issues.length} ARIA usage issues`, issues.map(i => i.element));
    }
  }

  // Test 5: Check color contrast (basic implementation)
  testColorContrast() {
    // This is a simplified version - in a real implementation, 
    // you'd use a more sophisticated color contrast calculation
    const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label');
    const issues = [];

    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Skip if no background color or transparent
      if (!backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
        return;
      }

      // Basic contrast check (this would need a proper contrast ratio calculation)
      // For now, just flag elements with very similar colors
      if (color === backgroundColor) {
        issues.push(element);
      }
    });

    if (issues.length === 0) {
      this.addResult('info', 'Color Contrast', 
        'Basic color contrast check passed - use external tools for comprehensive testing');
    } else {
      this.addResult('warnings', 'Color Contrast', 
        `${issues.length} potential color contrast issues`, issues);
    }
  }

  // Test 6: Check for keyboard focus indicators
  testFocusIndicators() {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const issues = [];

    focusableElements.forEach(element => {
      const styles = window.getComputedStyle(element, ':focus');
      const outline = styles.outline;
      const boxShadow = styles.boxShadow;
      
      // Check if element has focus indicators
      if (outline === 'none' && boxShadow === 'none') {
        // Check for focus ring classes (Tailwind patterns)
        const classes = element.className;
        if (!classes.includes('focus:') && !classes.includes('focus-')) {
          issues.push(element);
        }
      }
    });

    if (issues.length === 0) {
      this.addResult('passed', 'Focus Indicators', 'All focusable elements have focus indicators');
    } else {
      this.addResult('warnings', 'Focus Indicators', 
        `${issues.length} elements may be missing focus indicators`, issues);
    }
  }

  // Test 7: Check for minimum touch target sizes
  testTouchTargetSize() {
    const interactiveElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    const smallTargets = [];

    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      const minSize = 44; // WCAG AA minimum

      if (rect.width < minSize || rect.height < minSize) {
        smallTargets.push(element);
      }
    });

    if (smallTargets.length === 0) {
      this.addResult('passed', 'Touch Target Size', 'All interactive elements meet minimum size requirements');
    } else {
      this.addResult('warnings', 'Touch Target Size', 
        `${smallTargets.length} interactive elements below 44px minimum`, smallTargets);
    }
  }

  // Test 8: Check for proper table structure
  testTableStructure() {
    const tables = document.querySelectorAll('table');
    const issues = [];

    tables.forEach(table => {
      const caption = table.querySelector('caption');
      const headers = table.querySelectorAll('th');
      const hasHeaders = headers.length > 0;

      if (!caption && !table.getAttribute('aria-label') && !table.getAttribute('aria-labelledby')) {
        issues.push({
          element: table,
          issue: 'Table missing caption or accessible name'
        });
      }

      if (!hasHeaders) {
        issues.push({
          element: table,
          issue: 'Table missing header cells (th elements)'
        });
      }
    });

    if (tables.length === 0) {
      this.addResult('info', 'Table Structure', 'No tables found');
    } else if (issues.length === 0) {
      this.addResult('passed', 'Table Structure', 'All tables have proper structure');
    } else {
      this.addResult('failed', 'Table Structure', 
        `${issues.length} table structure issues`, issues.map(i => i.element));
    }
  }

  // Run all automated tests
  runAllTests() {
    console.group('🔍 Accessibility Test Suite - Automated Tests');
    
    this.clearResults();
    
    this.testImageAltText();
    this.testFormLabels();
    this.testHeadingHierarchy();
    this.testAriaUsage();
    this.testColorContrast();
    this.testFocusIndicators();
    this.testTouchTargetSize();
    this.testTableStructure();

    this.printResults();
    
    console.groupEnd();
    
    return this.results;
  }

  // Print formatted results
  printResults() {
    const { passed, failed, warnings, info } = this.results;

    if (passed.length > 0) {
      console.group('✅ Passed Tests');
      passed.forEach(result => {
        console.log(`✓ ${result.test}: ${result.message}`);
      });
      console.groupEnd();
    }

    if (failed.length > 0) {
      console.group('❌ Failed Tests');
      failed.forEach(result => {
        console.error(`✗ ${result.test}: ${result.message}`);
        if (result.elements.length > 0) {
          console.log('Affected elements:', result.elements);
        }
      });
      console.groupEnd();
    }

    if (warnings.length > 0) {
      console.group('⚠️ Warnings');
      warnings.forEach(result => {
        console.warn(`⚠ ${result.test}: ${result.message}`);
        if (result.elements.length > 0) {
          console.log('Affected elements:', result.elements);
        }
      });
      console.groupEnd();
    }

    if (info.length > 0) {
      console.group('ℹ️ Information');
      info.forEach(result => {
        console.info(`ℹ ${result.test}: ${result.message}`);
      });
      console.groupEnd();
    }

    // Summary
    const total = passed.length + failed.length + warnings.length;
    const score = total > 0 ? Math.round((passed.length / total) * 100) : 100;
    
    console.log(`\n📊 Accessibility Score: ${score}% (${passed.length}/${total} tests passed)`);
    
    if (failed.length > 0) {
      console.log(`🚨 ${failed.length} critical accessibility issues found`);
    }
    if (warnings.length > 0) {
      console.log(`⚠️ ${warnings.length} accessibility warnings`);
    }
  }
}

// ==============================================
// MANUAL TESTING PROCEDURES
// ==============================================

/**
 * Manual accessibility testing checklist
 */
export const manualTestingChecklist = {
  keyboardNavigation: [
    'Tab through all interactive elements in logical order',
    'Use Enter and Space to activate buttons and links',
    'Use arrow keys to navigate within components (menus, carousels)',
    'Ensure all functionality is keyboard accessible',
    'Check that focus is trapped within modals',
    'Verify skip links work correctly'
  ],
  
  screenReader: [
    'Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)',
    'Ensure all content is announced properly',
    'Check that form labels are read correctly',
    'Verify landmark navigation works',
    'Test that dynamic content updates are announced',
    'Check that error messages are announced'
  ],
  
  colorAndContrast: [
    'Test with high contrast mode enabled',
    'Verify information is not conveyed by color alone',
    'Check text contrast ratios meet WCAG AA standards (4.5:1)',
    'Test with different color vision deficiencies',
    'Ensure UI components have sufficient contrast'
  ],
  
  mobileAccessibility: [
    'Test touch target sizes (minimum 44px)',
    'Verify pinch-to-zoom functionality',
    'Check orientation support',
    'Test with screen reader on mobile',
    'Verify voice control functionality'
  ],
  
  cognitiveAccessibility: [
    'Check for clear, simple language',
    'Verify consistent navigation patterns',
    'Test timeout handling and warnings',
    'Check for clear error messages and recovery',
    'Verify progress indicators for multi-step processes'
  ]
};

/**
 * Accessibility testing report generator
 */
export class AccessibilityReport {
  constructor() {
    this.testSuite = new AccessibilityTestSuite();
  }

  generateReport() {
    const results = this.testSuite.runAllTests();
    const timestamp = new Date().toISOString();
    
    return {
      timestamp,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      results,
      manualTestingRequired: manualTestingChecklist,
      recommendations: this.generateRecommendations(results)
    };
  }

  generateRecommendations(results) {
    const recommendations = [];

    if (results.failed.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Critical Issues',
        items: results.failed.map(f => f.message)
      });
    }

    if (results.warnings.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Improvements',
        items: results.warnings.map(w => w.message)
      });
    }

    recommendations.push({
      priority: 'ongoing',
      category: 'Best Practices',
      items: [
        'Regularly test with real screen reader users',
        'Include accessibility testing in your CI/CD pipeline',
        'Train developers on accessibility best practices',
        'Conduct usability testing with users with disabilities'
      ]
    });

    return recommendations;
  }
}

// ==============================================
// TESTING UTILITIES
// ==============================================

/**
 * Accessibility testing utilities for development
 */
export const accessibilityTestUtils = {
  // Quick accessibility check
  quickCheck: () => {
    const testSuite = new AccessibilityTestSuite();
    return testSuite.runAllTests();
  },

  // Generate full report
  generateReport: () => {
    const report = new AccessibilityReport();
    return report.generateReport();
  },

  // Test specific component
  testComponent: (selector) => {
    const element = document.querySelector(selector);
    if (!element) {
      console.error(`Component not found: ${selector}`);
      return;
    }

    console.group(`Testing component: ${selector}`);
    
    // Run tests scoped to component
    const originalQuerySelectorAll = document.querySelectorAll;
    document.querySelectorAll = (sel) => element.querySelectorAll(sel);
    
    const testSuite = new AccessibilityTestSuite();
    const results = testSuite.runAllTests();
    
    // Restore original method
    document.querySelectorAll = originalQuerySelectorAll;
    
    console.groupEnd();
    
    return results;
  },

  // Live accessibility monitoring
  startMonitoring: () => {
    let observer;
    
    if (window.MutationObserver) {
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check new elements for accessibility issues
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                setTimeout(() => {
                  accessibilityTestUtils.quickCheck();
                }, 100);
              }
            });
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      console.log('🔍 Accessibility monitoring started');
    }

    return observer;
  },

  // Stop monitoring
  stopMonitoring: (observer) => {
    if (observer) {
      observer.disconnect();
      console.log('⏹️ Accessibility monitoring stopped');
    }
  }
};

// Export the main testing suite
export default AccessibilityTestSuite; 