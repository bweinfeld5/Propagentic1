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

    // Only add FAST_REFRESH definition if it doesn't already exist
    const hasDefinePlugin = config.plugins.some(
      plugin => plugin.constructor.name === 'DefinePlugin' && 
                plugin.definitions && 
                plugin.definitions['process.env.FAST_REFRESH']
    );

    if (!hasDefinePlugin) {
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.FAST_REFRESH': JSON.stringify('false'),
        })
      );
    }

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

    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /intro\.js/,
      },
      /Failed to parse source map from.*intro\.js/,
    ];

    return config;
  }
);
  