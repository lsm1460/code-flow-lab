const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      webpackConfig.entry = path.resolve(__dirname, './src/viewer-index.tsx');
      webpackConfig.resolve.plugins.push(new TsconfigPathsPlugin({}));
      paths.appBuild = webpackConfig.output.path = path.resolve(__dirname, 'temp-viewer');

      return webpackConfig; // Important: return the modified config
    },
  },
};
