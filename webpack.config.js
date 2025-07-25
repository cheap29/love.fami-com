const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/client/index.js",
    output: {
      path: path.resolve(__dirname, "dist/public"),
      filename: isProduction ? "[name].[contenthash].js" : "[name].js",
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            isProduction ? MiniCssExtractPlugin.loader : "style-loader",
            "css-loader",
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/i,
          type: "asset/resource",
          generator: {
            filename: "img/[name][ext]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/client/index.html",
        filename: "index.html",
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: "[name].[contenthash].css",
            }),
          ]
        : []),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "data",
            to: "data",
          },
          {
            from: "src/client/img",
            to: "img",
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "dist/public"),
      },
      compress: true,
      port: 3001,
      proxy: {
        "/api": "http://localhost:3000",
      },
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
  };
};
