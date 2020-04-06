const path = require('path');

module.exports = {
  mode: process.env.NODE_ENV,
  entry: {
    main: './src/index.js',
    sw: './src/sw.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          // fallback to style-loader in development
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
}
