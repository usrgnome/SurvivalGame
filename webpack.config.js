const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const { Compilation, sources } = require('webpack');

const https = require('https');

function httpsPost({ body, ...options }) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      method: 'POST',
      ...options,
    }, res => {
      const chunks = [];
      res.on('data', data => chunks.push(data))
      res.on('end', () => {
        let resBody = Buffer.concat(chunks).toString();
        switch (res.headers['content-type']) {
          case 'application/json':
            resBody = JSON.parse(resBody);
            break;
        }
        resolve(resBody)
      })
    })
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  })
}

class MyExampleWebpackPlugin {
  // Specify the event hook to attach to
  apply(compiler) {
    compiler.hooks.compilation.tap(
      "Hello World Plugin",
      (
        compilation /* stats is passed as an argument when done hook is tapped.  */
      ) => {
        compilation.hooks.processAssets.tapPromise(
          {
            name: "CodeProtector",
            stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE,
          },
          (assets) => {
            return new Promise(async (res, err) => {
              for (let chunk of compilation.chunks) {
                for (let fileName of chunk.files) {
                  if (!fileName.toLowerCase().endsWith(".js")) {
                    return;
                  }
                  const asset = compilation.assets[fileName];
                  const { inputSource } =
                    this.extractSourceAndSourceMap(asset);
                  const result = await this.obfuscate(inputSource);
                  assets[fileName] = new sources.RawSource(
                    result,
                    false
                  );
                }
              }
              res();
            });
          }
        );
      }
    );
  }

  extractSourceAndSourceMap(asset) {
    if (asset.sourceAndMap) {
      const { source, map } = asset.sourceAndMap();
      return {
        inputSource: source,
        inputSourceMap: map,
      };
    } else {
      return {
        inputSource: asset.source(),
        inputSourceMap: asset.map(),
      };
    }
  }

  async obfuscate(src) {

    const code = await httpsPost({
      hostname: 'tinyjsvm.com',
      path: `/api/compile`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: src,
      })
    });

    return JSON.parse(code).code;
  }
}

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
            hoist_funs: true,
            reduce_funcs: false,
            passes: 20,
            drop_console: true,
            drop_debugger: true,
            ecma: 2020,
            unsafe: true,
            toplevel: true,
          },
          mangle: {
            properties: {
              reserved: ["meta", "w", "h"]
            },
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
      //new MyExampleWebpackPlugin(),
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