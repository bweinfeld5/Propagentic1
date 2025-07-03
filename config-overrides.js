const path = require('path');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add webpack aliases for cleaner imports
  config.resolve.alias = {
    ...config.resolve.alias,
    '@components': path.resolve(__dirname, 'src/components'),
    '@services': path.resolve(__dirname, 'src/services'),
    '@utils': path.resolve(__dirname, 'src/utils'),
    '@models': path.resolve(__dirname, 'src/models'),
    '@contexts': path.resolve(__dirname, 'src/contexts'),
    '@hooks': path.resolve(__dirname, 'src/hooks'),
    '@assets': path.resolve(__dirname, 'src/assets'),
    '@firebase': path.resolve(__dirname, 'src/firebase'),
    '@types': path.resolve(__dirname, 'src/types')
  };

  // Add fallbacks for problematic modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "fs": false,
    "net": false,
    "tls": false,
    "child_process": false,
    "react-dom/server": false
  };

  // Add Buffer polyfill
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser'
    })
  ];

  // Suppress source map warnings
  config.ignoreWarnings = [/Failed to parse source map/];

  // Disable fast refresh in production
  if (env === 'production') {
    config.optimization = {
      ...config.optimization,
      minimize: true,
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        automaticNameDelimiter: '~',
        enforceSizeThreshold: 50000,
        cacheGroups: {
          defaultVendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          }
        }
      }
    };
  }

  return config;
}; 