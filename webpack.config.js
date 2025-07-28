const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "./src/client/index.js",
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: isProduction
        ? "famicon/[name].[contenthash].js"
        : "famicon/[name].js",
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
            filename: "famicon/img/[name][ext]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/client/index.html",
        filename: "famicon/index.html",
      }),
      ...(isProduction
        ? [
            new MiniCssExtractPlugin({
              filename: "famicon/[name].[contenthash].css",
            }),
          ]
        : []),
      new CopyWebpackPlugin({
        patterns: [
          // PHPファイルをWordPressテーマ構造にコピー
          {
            from: "server/functions.php",
            to: "wp-content/themes/saka.playground/functions.php",
          },
          // データファイルをWordPressテーマ構造にコピー
          {
            from: "data/games.json",
            to: "wp-content/themes/saka.playground/data/games.json",
          },
          // 画像ファイル
          {
            from: "src/client/img",
            to: "famicon/img",
            noErrorOnMissing: true,
          },
        ],
      }),
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, "dist/famicon"),
      },
      compress: true,
      port: 8080,
    },
    devtool: isProduction ? "source-map" : "eval-source-map",
  };
};
