const { override, addWebpackAlias } = require('customize-cra');
const path = require('path');
const webpack = require('webpack');

module.exports = override(
  // Add any necessary aliases here
  addWebpackAlias({
    // Example: '@components': path.resolve(__dirname, 'src/components')
  }),

  (config) => {
    // Completely disable Fast Refresh to prevent $RefreshSig$ errors
    config.plugins = config.plugins.filter(
      plugin => !plugin.constructor.name.includes('ReactRefresh')
    );

    // Set FAST_REFRESH via environment instead of DefinePlugin to avoid conflicts
    process.env.FAST_REFRESH = 'false';

    // Core module fallbacks and polyfills
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

    // Suppress source map warnings
    config.module.rules.push({
      test: /intro\.js/,
      use: ['source-map-loader'],
      enforce: 'pre',
      exclude: /node_modules\/intro\.js/
    });

    // Configure CSS minimizer to suppress postcss-calc warnings
    if (config.optimization && config.optimization.minimizer) {
      config.optimization.minimizer.forEach(minimizer => {
        if (minimizer.constructor.name === 'CssMinimizerPlugin') {
          minimizer.options = minimizer.options || {};
          minimizer.options.minimizerOptions = minimizer.options.minimizerOptions || {};
          minimizer.options.minimizerOptions.preset = [
            'default',
            {
              calc: false, // Disable calc optimization to prevent CSS variable parsing errors
            }
          ];
        }
      });
    }

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /intro\.js/,
      },
      /Failed to parse source map from.*intro\.js/,
      // Suppress postcss-calc warnings for CSS variables
      /postcss-calc:/,
    ];

    return config;
  }
);
  