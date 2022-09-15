const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = function (env) {
  const isProduction = !!env.production;
  const isDevelopment = !isProduction;

  const config = {
    entry: path.join(__dirname, 'server/src/index.ts'),
    mode: isProduction ? 'production' : 'development',
    optimization: {
      minimize: isProduction,
      minimizer: [new TerserPlugin({
        terserOptions: {
          compress: {
            hoist_funs: true,
            reduce_funcs: false,
            passes: 20,
            ecma: 2020,
            unsafe: true,
            toplevel: true,
          },
          mangle: {
            properties: false,
          },
          ecma: 2020,
          toplevel: true,
        }
      })],
    },
    module: {
      rules: [
        {
          test: /\.(js|ts|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ['@babel/preset-env', {
                "exclude": ["transform-typeof-symbol"],
              }],
              targets: {
                chrome: "80"
              },
              plugins: ['@babel/plugin-transform-runtime']
            }
          }
        }
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
      filename: 'server.js',
      path: path.resolve(__dirname, 'server/build'),
    },

     externalsPresets: { node: true }, // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()], 
  };

  return config;
}