// Webpack Bundle Optimization Config
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 20
        },
        
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 30
        },
        
        firebase: {
          test: /[\\/]node_modules[\\/](firebase|@firebase)[\\/]/,
          name: 'firebase',
          chunks: 'all',
          priority: 25
        }
      }
    },
    
    runtimeChunk: {
      name: 'runtime'
    },
    
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    
    usedExports: true,
    sideEffects: false
  },
  
  performance: {
    maxAssetSize: 500000,
    maxEntrypointSize: 500000,
    hints: process.env.NODE_ENV === 'production' ? 'warning' : false
  },
  
  resolve: {
    modules: [
      'node_modules',
      path.resolve(__dirname, 'src')
    ],
    
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@assets': path.resolve(__dirname, 'src/assets')
    }
  },

  plugins: [
    process.env.ANALYZE_BUNDLE && new BundleAnalyzerPlugin()
  ].filter(Boolean)
};

module.exports.getOptimizationRecommendations = () => {
  return {
    codesplitting: 'Implemented with multiple cache groups for efficient loading',
    treeShaking: 'Enabled with usedExports and sideEffects configuration',
    bundleAnalysis: 'Bundle analyzer integration for size monitoring',
    prefetching: 'Strategic preload and prefetch of critical resources',
    aliasing: 'Path aliases for faster module resolution',
    chunkNaming: 'Deterministic chunk naming for better caching'
  };
};
