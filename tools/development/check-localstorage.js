/**
 * Check and manipulate localStorage data in the browser
 * This script uses Playwright to inspect and modify localStorage in the running app
 * 
 * Run with: node check-localstorage.js [command] [key] [value]
 * Commands:
 *   list - List all localStorage items
 *   get [key] - Get value of a specific key
 *   set [key] [value] - Set value for a key
 *   delete [key] - Delete a specific key
 *   clear - Clear all localStorage
 */

const { chromium } = require('playwright');

// Default app URL
const APP_URL = 'http://localhost:3000';

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  const key = args[1];
  const value = args[2];

  console.log(`Running command: ${command}${key ? ' for key: ' + key : ''}${value ? ' with value: ' + value : ''}`);
  
  // Launch browser and go to app
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Go to app URL
    console.log(`Navigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    // Wait a bit to make sure app has loaded
    await page.waitForTimeout(2000);
    
    // Execute the appropriate command
    let result;
    
    switch (command) {
      case 'list':
        result = await page.evaluate(() => {
          const items = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            items[key] = localStorage.getItem(key);
          }
          return items;
        });
        console.log('\nLocalStorage Contents:');
        console.log('---------------------');
        if (Object.keys(result).length === 0) {
          console.log('No items in localStorage');
        } else {
          for (const [key, value] of Object.entries(result)) {
            console.log(`${key}: ${value}`);
            try {
              // Try to parse as JSON
              const parsed = JSON.parse(value);
              console.log(`  (parsed): ${JSON.stringify(parsed, null, 2)}`);
            } catch (e) {
              // Not JSON, that's fine
            }
          }
        }
        break;
        
      case 'get':
        if (!key) {
          console.error('Error: Key is required for get command');
          break;
        }
        result = await page.evaluate((key) => {
          return localStorage.getItem(key);
        }, key);
        
        if (result === null) {
          console.log(`Key "${key}" not found in localStorage`);
        } else {
          console.log(`${key}: ${result}`);
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(result);
            console.log(`(parsed): ${JSON.stringify(parsed, null, 2)}`);
          } catch (e) {
            // Not JSON, that's fine
          }
        }
        break;
        
      case 'set':
        if (!key) {
          console.error('Error: Key is required for set command');
          break;
        }
        
        await page.evaluate((key, value) => {
          localStorage.setItem(key, value);
          return true;
        }, key, value || '');
        
        console.log(`Set "${key}" to "${value || ''}"`);
        break;
        
      case 'delete':
        if (!key) {
          console.error('Error: Key is required for delete command');
          break;
        }
        
        await page.evaluate((key) => {
          localStorage.removeItem(key);
          return true;
        }, key);
        
        console.log(`Deleted key: "${key}"`);
        break;
        
      case 'clear':
        await page.evaluate(() => {
          localStorage.clear();
          return true;
        });
        
        console.log('Cleared all localStorage items');
        break;
        
      default:
        console.error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Make sure your app is running on the correct URL:', APP_URL);
  } finally {
    // Close browser
    await browser.close();
  }
}

main().catch(console.error); 