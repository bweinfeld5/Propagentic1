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
          rule.oneOf.forEach(oneOf => {
            if (oneOf.use && Array.isArray(oneOf.use)) {
              oneOf.use.forEach(use => {
                if (use.loader && use.loader.includes('babel-loader') && use.options && use.options.presets) {
                  use.options.presets = use.options.presets.map(preset => {
                    if (Array.isArray(preset) && preset[0] && preset[0].includes('babel-preset-react-app')) {
                      return [preset[0], { ...preset[1], runtime: 'classic', refresh: false }];
                    }
                    return preset;
                  });
                }
              });
            }
          });
        }
      });
    }

    // 4. Remove react-refresh/babel from plugins
    if (config.module && config.module.rules) {
      config.module.rules.forEach(rule => {
        if (rule.oneOf) {
          rule.oneOf.forEach(oneOf => {
            if (oneOf.use && Array.isArray(oneOf.use)) {
              oneOf.use.forEach(use => {
                if (
                  use.loader &&
                  use.loader.includes('babel-loader') &&
                  use.options &&
                  use.options.plugins
                ) {
                  use.options.plugins = use.options.plugins.filter(
                    plugin => !plugin.includes('react-refresh/babel')
                  );
                }
              });
            }
          });
        }
      });
    }

    // 5. Set environment variables
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.FAST_REFRESH': JSON.stringify('false'),
        'process.env.REACT_REFRESH': JSON.stringify('false'),
      })
    );

    // --- Core module fallbacks and polyfills ---
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "crypto": require.resolve("crypto-browserify"),
      "stream": require.resolve("stream-browserify"),
      "assert": require.resolve("assert"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify"),
      "os": require.resolve("os-browserify"),
      "url": require.resolve("url"),
      "path": require.resolve("path-browserify"),
    };

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

    console.log("Applied core module fallbacks and polyfills. Fast Refresh is now disabled.");
    return config;
  }
);
  