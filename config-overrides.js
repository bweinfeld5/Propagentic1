const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
const path = require('path');
const webpack = require('webpack');

module.exports = override(
  // Add any necessary aliases here
  addWebpackAlias({
    // Example: '@components': path.resolve(__dirname, 'src/components')
  }),

  (config) => {
    // --- Disable React Fast Refresh regardless of environment ---
    // This tackles the react-refresh/runtime.js issue
    console.log("Disabling React Fast Refresh for all builds");
    
    // 1. Filter out the ReactRefreshPlugin
    config.plugins = config.plugins.filter(
      plugin => !plugin.constructor || plugin.constructor.name !== 'ReactRefreshPlugin'
    );
    
    // 2. Remove react-refresh/runtime.js from entry points
    if (config.entry) {
      if (Array.isArray(config.entry)) {
        config.entry = config.entry.filter(
          entry => !entry || !entry.includes('react-refresh/runtime.js')
        );
      } else if (typeof config.entry === 'object') {
        Object.keys(config.entry).forEach(key => {
          if (Array.isArray(config.entry[key])) {
            config.entry[key] = config.entry[key].filter(
              entry => !entry || !entry.includes('react-refresh/runtime.js')
            );
          }
        });
      }
    }
    
    // 3. Remove any babel plugins related to react-refresh
    if (config.module && config.module.rules) {
      config.module.rules.forEach(rule => {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach(loader => {
            if (loader.loader && loader.loader.includes('babel-loader') && loader.options && loader.options.plugins) {
              loader.options.plugins = loader.options.plugins.filter(
                plugin => !plugin || (Array.isArray(plugin) && !plugin[0]?.includes('react-refresh'))
              );
            }
          });
        }
      });
    }

    // --- Webpack 5 Polyfills --- 
    // Necessary for dependencies that expect Node.js core modules
    config.resolve.fallback = {
      ...config.resolve.fallback, // Preserve existing fallbacks
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "vm": require.resolve("vm-browserify"),
      "constants": require.resolve("constants-browserify"),
      "fs": false, // Indicate 'fs' is not available
      "child_process": false,
      "module": false,
      "net": false,
      "tls": false,
      "zlib": false,
      "http": false,
      "https": false,
      "url": false
    };

    // Add polyfills that CRA 5 removed
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: require.resolve('process/browser'),
        Buffer: ['buffer', 'Buffer'],
      })
    );

    // Define environment variables to disable Fast Refresh
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.FAST_REFRESH': JSON.stringify(false),
        '__REACT_REFRESH_RUNTIME__': 'false',
      })
    );

    // --- Suppress source map warnings from intro.js ---
    // The intro.js library has malformed source maps that cause warnings
    config.module.rules.push({
      test: /intro\.js/,
      use: ['source-map-loader'],
      enforce: 'pre',
      exclude: /node_modules\/intro\.js/
    });

    // Configure webpack to ignore source map warnings from intro.js
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /intro\.js/,
      },
      /Failed to parse source map from.*intro\.js/,
    ];

    console.log("Applied core module fallbacks and polyfills.");
    console.log("Configured to suppress intro.js source map warnings.");
    return config;
  }
);
  