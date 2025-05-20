const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
const path = require('path');
const webpack = require('webpack');

module.exports = override(
  // Add any necessary aliases here
  addWebpackAlias({
    // Example: '@components': path.resolve(__dirname, 'src/components')
  }),

  (config) => {
    // --- Fix react-refresh module import errors ---
    // Check if FAST_REFRESH is explicitly set to false
    if (process.env.FAST_REFRESH === 'false') {
      console.log("Disabling Fast Refresh features");
      // Filter out any plugins related to react-refresh
      config.plugins = config.plugins.filter(plugin => 
        !plugin.constructor || plugin.constructor.name !== 'ReactRefreshPlugin'
      );
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

    console.log("Applied core module fallbacks and polyfills.");
    return config;
  }
);
  