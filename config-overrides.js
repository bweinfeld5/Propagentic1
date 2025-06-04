const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
const path = require('path');
const webpack = require('webpack');

module.exports = override(
  // Add any necessary aliases here
  addWebpackAlias({
    // Example: '@components': path.resolve(__dirname, 'src/components')
  }),

  (config) => {
    // --- COMPLETELY DISABLE FAST REFRESH ---
    console.log("Completely disabling React Fast Refresh");
    
    // 1. Remove all ReactRefreshPlugin instances
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== 'ReactRefreshPlugin'
    );
    
    // 2. Remove React Refresh Webpack Plugin
    config.plugins = config.plugins.filter(
      plugin => !plugin.constructor.name.includes('ReactRefresh')
    );
    
    // 3. Disable the babel preset that injects Fast Refresh
    if (config.module && config.module.rules) {
      config.module.rules.forEach(rule => {
        if (rule.oneOf) {
          rule.oneOf.forEach(oneOfRule => {
            if (oneOfRule.use && Array.isArray(oneOfRule.use)) {
              oneOfRule.use.forEach(loader => {
                if (loader.loader && loader.loader.includes('babel-loader')) {
                  if (loader.options && loader.options.presets) {
                    loader.options.presets = loader.options.presets.map(preset => {
                      if (Array.isArray(preset) && preset[0] && preset[0].includes('react-app')) {
                        return [preset[0], { ...preset[1], runtime: 'classic', refresh: false }];
                      }
                      return preset;
                    });
                  }
                  if (loader.options && loader.options.plugins) {
                    loader.options.plugins = loader.options.plugins.filter(
                      plugin => {
                        if (typeof plugin === 'string') {
                          return !plugin.includes('react-refresh');
                        }
                        if (Array.isArray(plugin) && plugin[0]) {
                          return !plugin[0].includes('react-refresh');
                        }
                        return true;
                      }
                    );
                  }
                  // Explicitly set refresh to false
                  if (loader.options) {
                    loader.options.refresh = false;
                  }
                }
              });
            }
          });
        }
      });
    }

    // 4. Set environment variables to disable Fast Refresh
    process.env.FAST_REFRESH = 'false';
    process.env.REACT_REFRESH = 'false';
    
    // --- Webpack 5 Polyfills --- 
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "path": require.resolve("path-browserify"),
      "os": require.resolve("os-browserify/browser"),
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "vm": require.resolve("vm-browserify"),
      "constants": require.resolve("constants-browserify"),
      "fs": false,
      "child_process": false,
      "module": false,
      "net": false,
      "tls": false,
      "zlib": false,
      "http": false,
      "https": false,
      "url": false
    };

    // Add polyfills
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: require.resolve('process/browser'),
        Buffer: ['buffer', 'Buffer'],
      })
    );

    // Define environment to disable Fast Refresh
    // Find and modify existing DefinePlugin instead of adding a new one
    const definePlugin = config.plugins.find(
      plugin => plugin.constructor.name === 'DefinePlugin'
    );
    
    if (definePlugin) {
      // Modify the existing DefinePlugin
      definePlugin.definitions['process.env.FAST_REFRESH'] = JSON.stringify('false');
      definePlugin.definitions['process.env.REACT_REFRESH'] = JSON.stringify('false');
    } else {
      // Only add if it doesn't exist
    config.plugins.push(
      new webpack.DefinePlugin({
          'process.env.FAST_REFRESH': JSON.stringify('false'),
          'process.env.REACT_REFRESH': JSON.stringify('false')
      })
    );
    }

    // --- Suppress source map warnings from intro.js ---
    config.module.rules.push({
      test: /intro\.js/,
      use: ['source-map-loader'],
      enforce: 'pre',
      exclude: /node_modules\/intro\.js/
    });

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /intro\.js/,
      },
      /Failed to parse source map from.*intro\.js/,
    ];

    console.log("Applied core module fallbacks and polyfills.");
    return config;
  }
);
  