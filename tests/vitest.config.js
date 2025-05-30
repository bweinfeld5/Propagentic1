/**
 * Vitest Configuration
 * Test configuration for PropAgentic Analytics services and components
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // Test environment setup
    environment: 'jsdom',
    globals: true,
    
    // Setup files
    setupFiles: [
      './tests/setup/test-setup.js',
      './tests/setup/mock-setup.js'
    ],
    
    // File patterns
    include: [
      'tests/**/*.test.{js,jsx,ts,tsx}',
      'tests/**/*.spec.{js,jsx,ts,tsx}',
      'src/**/__tests__/**/*.{js,jsx,ts,tsx}',
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      'tests/setup/**',
      'tests/fixtures/**',
      'tests/utils/**'
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'coverage/',
        'dist/',
        'build/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/index.{js,ts}',
        '**/__tests__/**',
        '**/*.test.{js,jsx,ts,tsx}',
        '**/*.spec.{js,jsx,ts,tsx}',
        'src/firebase/config.js',
        'src/reportWebVitals.js',
        'src/setupTests.js'
      ],
      include: [
        'src/services/analytics/**/*.{js,jsx,ts,tsx}',
        'src/components/analytics/**/*.{js,jsx,ts,tsx}'
      ],
      // Coverage thresholds
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        'src/services/analytics/': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        'src/components/analytics/': {
          branches: 75,
          functions: 75,
          lines: 75,
          statements: 75
        }
      }
    },
    
    // Timeout configuration
    testTimeout: 10000,
    hookTimeout: 5000,
    
    // Watch configuration
    watch: false,
    
    // Reporter configuration
    reporter: process.env.CI ? ['json', 'github-actions'] : ['verbose'],
    
    // Output configuration
    outputFile: {
      json: './test-results.json',
      html: './test-results.html'
    },
    
    // Mock configuration
    clearMocks: true,
    restoreMocks: true,
    mockReset: true,
    
    // Pool configuration for parallel testing
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    
    // Isolation configuration
    isolate: true,
    
    // Retry configuration
    retry: process.env.CI ? 2 : 0,
    
    // Browser mode (optional)
    // browser: {
    //   enabled: false,
    //   name: 'chrome',
    //   provider: 'playwright'
    // },
    
    // Snapshot configuration
    snapshotFormat: {
      escapeString: true,
      printBasicPrototype: true
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@services': path.resolve(__dirname, '../src/services'),
      '@utils': path.resolve(__dirname, '../src/utils'),
      '@types': path.resolve(__dirname, '../src/types'),
      '@test-utils': path.resolve(__dirname, './utils'),
      '@fixtures': path.resolve(__dirname, './fixtures')
    }
  },
  
  // Define configuration for test environment
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.VITE_TEST': '"true"'
  },
  
  // Esbuild configuration
  esbuild: {
    target: 'node14'
  }
}); 