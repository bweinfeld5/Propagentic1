module.exports = {
  presets: [
    [
      'babel-preset-react-app',
      {
        runtime: 'classic',
        refresh: false
      }
    ]
  ],
  plugins: [
    // Explicitly exclude any Fast Refresh plugins
  ].filter(Boolean)
}; 