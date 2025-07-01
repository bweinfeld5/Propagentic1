/**
 * Integration Test Script for PropAgentic UI Components
 * 
 * This script helps test our UI components across different browsers
 * to ensure consistency and compatibility.
 * 
 * Usage:
 * 1. Install Playwright: npm install -D playwright
 * 2. Run: node integration-test.js
 */

const { chromium, firefox, webkit } = require('playwright');

// Configuration
const config = {
  appUrl: 'http://localhost:3001/ui-showcase', // URL to the showcase page
  screenshotDir: './browser-tests',
  viewports: [
    { width: 1920, height: 1080, name: 'desktop' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 375, height: 667, name: 'mobile' }
  ],
  browsers: [
    { name: 'chromium', instance: chromium },
    { name: 'firefox', instance: firefox },
    { name: 'safari', instance: webkit }
  ],
  components: [
    { 
      id: 'animated-stats', 
      name: 'AnimatedDashboardStats',
      interactions: [
        async (page) => { 
          // Wait for animations to complete
          await page.waitForTimeout(2000);
        }
      ]
    },
    { 
      id: 'charts-section', 
      name: 'StatsChart',
      interactions: [
        async (page) => { 
          // Wait for charts to render
          await page.waitForTimeout(1000);
          // Hover over a chart point
          const chartArea = await page.locator('#charts-section canvas').first();
          const box = await chartArea.boundingBox();
          if (box) {
            await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
          }
        }
      ]
    },
    { 
      id: 'sortable-tasks', 
      name: 'SortableTaskList',
      interactions: [
        async (page) => {
          // Find the first task
          const firstTask = await page.locator('#sortable-tasks li').first();
          if (await firstTask.isVisible()) {
            // Click on the task
            await firstTask.click();
            // Wait a moment to see any animations
            await page.waitForTimeout(500);
          }
        }
      ]
    },
    { 
      id: 'dropzone', 
      name: 'AnimatedDropzone',
      interactions: [
        async (page) => {
          // Click the dropzone to activate it
          const dropzone = await page.locator('#dropzone .border-dashed').first();
          if (await dropzone.isVisible()) {
            await dropzone.click();
            // Wait to see file dialog activation
            await page.waitForTimeout(500);
          }
        }
      ]
    },
    { 
      id: 'property-map', 
      name: 'PropertyMapVisualization',
      interactions: [
        async (page) => {
          // Wait for map to load
          await page.waitForTimeout(2000);
          // Find and click on a map marker if it exists
          const mapContainer = await page.locator('#property-map svg circle').first();
          if (await mapContainer.count() > 0) {
            await mapContainer.click();
            // Wait to see tooltip
            await page.waitForTimeout(500);
          }
        }
      ]
    }
  ]
};

// Main test runner
async function runTests() {
  console.log('Starting integration tests across browsers...');
  console.log(`Testing URL: ${config.appUrl}`);
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: []
  };
  
  // Create a timestamp for this test run
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  
  // Test each browser
  for (const browser of config.browsers) {
    console.log(`\nTesting with ${browser.name}...`);
    let browserInstance;
    
    try {
      // Launch browser
      browserInstance = await browser.instance.launch({ headless: true });
      
      // Test each viewport
      for (const viewport of config.viewports) {
        console.log(`  Viewport: ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        // Create a new context and page for each viewport
        const context = await browserInstance.newContext({
          viewport: { width: viewport.width, height: viewport.height }
        });
        const page = await context.newPage();
        
        try {
          // Navigate to the app
          console.log(`  Navigating to ${config.appUrl}`);
          await page.goto(config.appUrl, { timeout: 30000, waitUntil: 'networkidle' });
          
          // Take initial screenshot
          await page.screenshot({ 
            path: `${config.screenshotDir}/${timestamp}-${browser.name}-${viewport.name}-initial.png` 
          });
          
          // Test each component
          for (const component of config.components) {
            console.log(`    Testing ${component.name}...`);
            results.total++;
            
            try {
              // Check if component is visible
              const element = await page.locator(`#${component.id}`);
              const isVisible = await element.isVisible();
              
              if (!isVisible) {
                console.log(`    ⚠️ Component ${component.name} not visible, skipping tests`);
                results.skipped++;
                results.details.push({
                  browser: browser.name,
                  viewport: viewport.name,
                  component: component.name,
                  status: 'skipped',
                  error: 'Component not visible'
                });
                continue;
              }
              
              // Take component screenshot
              await element.screenshot({ 
                path: `${config.screenshotDir}/${timestamp}-${browser.name}-${viewport.name}-${component.name}.png` 
              });
              
              // Run component interactions
              for (const interaction of component.interactions) {
                await interaction(page);
              }
              
              // Take post-interaction screenshot
              await element.screenshot({ 
                path: `${config.screenshotDir}/${timestamp}-${browser.name}-${viewport.name}-${component.name}-after.png` 
              });
              
              // Record success
              console.log(`    ✅ ${component.name} tests passed`);
              results.passed++;
              results.details.push({
                browser: browser.name,
                viewport: viewport.name,
                component: component.name,
                status: 'passed'
              });
            } catch (error) {
              // Record failure
              console.error(`    ❌ Error testing ${component.name}:`, error.message);
              results.failed++;
              results.details.push({
                browser: browser.name,
                viewport: viewport.name,
                component: component.name,
                status: 'failed',
                error: error.message
              });
              
              // Take error screenshot
              await page.screenshot({ 
                path: `${config.screenshotDir}/${timestamp}-${browser.name}-${viewport.name}-${component.name}-error.png` 
              });
            }
          }
        } catch (pageError) {
          console.error(`  ❌ Error loading page in ${browser.name}/${viewport.name}:`, pageError.message);
          
          // Take error screenshot
          await page.screenshot({ 
            path: `${config.screenshotDir}/${timestamp}-${browser.name}-${viewport.name}-page-error.png` 
          });
          
          // Count all components as failed for this viewport/browser
          const failedCount = config.components.length;
          results.total += failedCount;
          results.failed += failedCount;
          
          for (const component of config.components) {
            results.details.push({
              browser: browser.name,
              viewport: viewport.name,
              component: component.name,
              status: 'failed',
              error: `Page failed to load: ${pageError.message}`
            });
          }
        } finally {
          await context.close();
        }
      }
    } catch (browserError) {
      console.error(`❌ Failed to launch ${browser.name}:`, browserError.message);
      
      // Count all components and viewports as skipped for this browser
      const skippedCount = config.components.length * config.viewports.length;
      results.total += skippedCount;
      results.skipped += skippedCount;
      
      for (const viewport of config.viewports) {
        for (const component of config.components) {
          results.details.push({
            browser: browser.name,
            viewport: viewport.name,
            component: component.name,
            status: 'skipped',
            error: `Browser failed to launch: ${browserError.message}`
          });
        }
      }
    } finally {
      if (browserInstance) {
        await browserInstance.close();
      }
    }
  }
  
  // Print summary
  console.log('\n----- TEST SUMMARY -----');
  console.log(`Total tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${Math.round(results.passed / results.total * 100)}%)`);
  console.log(`Failed: ${results.failed} (${Math.round(results.failed / results.total * 100)}%)`);
  console.log(`Skipped: ${results.skipped} (${Math.round(results.skipped / results.total * 100)}%)`);
  
  // Generate report
  const reportPath = `${config.screenshotDir}/${timestamp}-report.json`;
  const fs = require('fs');
  
  // Ensure directory exists
  if (!fs.existsSync(config.screenshotDir)){
    fs.mkdirSync(config.screenshotDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\nDetailed report saved to ${reportPath}`);
  
  // Return exit code based on test results
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 