const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function (env) {
  const isProduction = !!env.production;
  const isDevelopment = !isProduction;

  const config = {
    target: ["web", "es2020"],
    entry: path.join(__dirname, 'client/src/index.ts'),
    mode: isProduction ? 'production' : 'development',
    optimization: {
      minimize: isProduction,
      minimizer: [new TerserPlugin({
        terserOptions: {
          compress: {
            hoist_funs: false,
            passes: 20,
            ecma: 2020,
            unsafe: true,
            toplevel: true,
          },
          mangle: {
            properties: true,
            reserved: [/meta/, "meta"]
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
      extensions: ['.tsx', '.ts', '.js', 'scss'],
    },
    output: {
      filename: '[contenthash].js',
      path: path.resolve(__dirname, 'client/build'),
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: 'body',
        template: path.join(__dirname, 'client/src/assets/index.html'),
      }),
      new CopyPlugin({
        patterns: [
          { from: "./client/src/assets/styles" },
          { from: "./client/src/assets/fonts", to: "fonts/" },
          { from: "./client/src/assets/img", to: "img/" },
        ],
      }),
    ],
  };

  // if the process is run in development, start a proxy server to emulate the production environment
  if (isDevelopment) {
    config.devServer = {
      static: {
        directory: path.join(__dirname, 'client/build'),
      },
      compress: true,
      port: 8080,
      proxy: {
        '/api': 'http://localhost:3000',
        '/wss': {
          target: 'http://localhost:9000',
          ws: true,
        }
      },
    };
  }

  return config;
}