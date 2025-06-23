#!/usr/bin/env node

/**
 * Accessibility Audit for Phase 2 Maintenance Components
 * Checks ARIA compliance, keyboard navigation, and color contrast
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_TO_AUDIT = [
  'src/components/landlord/MaintenanceDashboard.tsx',
  'src/components/tenant/TenantRequestHistory.tsx',
  'src/components/contractor/ContractorJobBoard.tsx',
  'src/components/maintenance/RequestStatusTracker.tsx'
];

const ACCESSIBILITY_CHECKS = {
  ariaLabels: {
    required: ['button', 'input', 'select', 'textarea'],
    patterns: [
      /aria-label=["'][^"']+["']/g,
      /aria-labelledby=["'][^"']+["']/g,
      /aria-describedby=["'][^"']+["']/g
    ]
  },
  keyboardNavigation: {
    interactiveElements: ['button', 'input', 'select', 'a', 'textarea'],
    required: ['onKeyDown', 'onKeyPress', 'tabIndex']
  },
  semanticHtml: {
    required: ['main', 'section', 'article', 'nav', 'header'],
    avoid: ['div role="button"', 'span onClick']
  },
  colorContrast: {
    textClasses: [
      'text-gray-500', 'text-gray-400', 'text-gray-300',
      'text-blue-400', 'text-green-400', 'text-red-400'
    ]
  }
};

function auditFile(filePath) {
  console.log(`\n🔍 Auditing: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return { issues: [], warnings: [], passed: 0 };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const warnings = [];
  let passed = 0;

  // Check 1: ARIA Labels on Interactive Elements
  console.log('\n  📋 Checking ARIA Labels...');
  const buttonMatches = content.match(/<button[^>]*>/g) || [];
  const inputMatches = content.match(/<input[^>]*>/g) || [];
  const interactiveElements = [...buttonMatches, ...inputMatches];
  
  interactiveElements.forEach((element, index) => {
    const hasAriaLabel = ACCESSIBILITY_CHECKS.ariaLabels.patterns.some(pattern => 
      pattern.test(element)
    );
    
    if (!hasAriaLabel && !element.includes('aria-label')) {
      issues.push(`Missing ARIA label on interactive element: ${element.substring(0, 50)}...`);
    } else {
      passed++;
    }
  });

  // Check 2: Keyboard Navigation Support
  console.log('  ⌨️ Checking Keyboard Navigation...');
  const hasKeyboardHandlers = content.includes('onKeyDown') || 
                              content.includes('onKeyPress') || 
                              content.includes('tabIndex');
  
  if (interactiveElements.length > 0 && !hasKeyboardHandlers) {
    issues.push('No keyboard navigation handlers found for interactive elements');
  } else if (hasKeyboardHandlers) {
    passed++;
  }

  // Check 3: Semantic HTML Structure
  console.log('  🏗️ Checking Semantic HTML...');
  const hasSemanticElements = ACCESSIBILITY_CHECKS.semanticHtml.required.some(tag =>
    content.includes(`<${tag}`) || content.includes(`<${tag} `)
  );
  
  if (!hasSemanticElements) {
    warnings.push('Consider using semantic HTML elements (main, section, article, nav, header)');
  } else {
    passed++;
  }

  // Check 4: Screen Reader Compatibility
  console.log('  📢 Checking Screen Reader Support...');
  const hasScreenReaderText = content.includes('sr-only') || 
                             content.includes('screen-reader-only') ||
                             content.includes('visually-hidden');
  
  if (!hasScreenReaderText) {
    warnings.push('Consider adding screen reader only text for better context');
  } else {
    passed++;
  }

  // Check 5: Color Contrast Issues
  console.log('  🎨 Checking Color Contrast...');
  const lowContrastClasses = ACCESSIBILITY_CHECKS.colorContrast.textClasses.filter(cls =>
    content.includes(cls)
  );
  
  if (lowContrastClasses.length > 0) {
    warnings.push(`Potential low contrast classes found: ${lowContrastClasses.join(', ')}`);
  } else {
    passed++;
  }

  // Check 6: Focus Management
  console.log('  🎯 Checking Focus Management...');
  const hasFocusManagement = content.includes('focus()') || 
                            content.includes('autoFocus') ||
                            content.includes('tabIndex');
  
  if (interactiveElements.length > 5 && !hasFocusManagement) {
    warnings.push('Consider implementing focus management for complex interfaces');
  } else {
    passed++;
  }

  return { issues, warnings, passed };
}

function generateReport(results) {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 ACCESSIBILITY AUDIT REPORT - Phase 2 Components');
  console.log('='.repeat(60));

  let totalIssues = 0;
  let totalWarnings = 0;
  let totalPassed = 0;

  Object.entries(results).forEach(([file, result]) => {
    totalIssues += result.issues.length;
    totalWarnings += result.warnings.length;
    totalPassed += result.passed;

    console.log(`\n📄 ${file}`);
    console.log(`   ✅ Passed: ${result.passed}`);
    console.log(`   ⚠️  Warnings: ${result.warnings.length}`);
    console.log(`   ❌ Issues: ${result.issues.length}`);

    if (result.issues.length > 0) {
      console.log('\n   🚨 Critical Issues:');
      result.issues.forEach(issue => console.log(`      • ${issue}`));
    }

    if (result.warnings.length > 0) {
      console.log('\n   ⚠️  Improvement Opportunities:');
      result.warnings.forEach(warning => console.log(`      • ${warning}`));
    }
  });

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Total Checks Passed: ${totalPassed}`);
  console.log(`⚠️  Total Warnings: ${totalWarnings}`);
  console.log(`❌ Total Critical Issues: ${totalIssues}`);

  const score = totalPassed / (totalPassed + totalWarnings + totalIssues * 2) * 100;
  console.log(`🎯 Accessibility Score: ${Math.round(score)}%`);

  if (score >= 90) {
    console.log('🏆 Excellent accessibility compliance!');
  } else if (score >= 75) {
    console.log('👍 Good accessibility, minor improvements needed.');
  } else if (score >= 60) {
    console.log('⚠️  Moderate accessibility issues to address.');
  } else {
    console.log('🚨 Significant accessibility improvements required.');
  }

  console.log('\n📚 Resources:');
  console.log('• WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/');
  console.log('• React Accessibility: https://reactjs.org/docs/accessibility.html');
  console.log('• ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/');

  return score;
}

// Run the audit
console.log('🚀 Starting Phase 2 Accessibility Audit...');

const results = {};
COMPONENTS_TO_AUDIT.forEach(componentPath => {
  results[componentPath] = auditFile(componentPath);
});

const score = generateReport(results);

// Exit with appropriate code
process.exit(score >= 75 ? 0 : 1); 