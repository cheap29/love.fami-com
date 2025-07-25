const fs = require("fs");
const path = require("path");

// distディレクトリの作成
const distDir = path.join(__dirname, "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// サーバーファイルのコピー
const serverSource = path.join(__dirname, "src", "server.js");
const serverDest = path.join(distDir, "server.js");

fs.copyFileSync(serverSource, serverDest);
console.log("✅ サーバーファイルをdistフォルダにコピーしました");

// package.jsonの必要部分をコピー
const packageJson = require("./package.json");
const distPackageJson = {
  name: packageJson.name,
  version: packageJson.version,
  description: packageJson.description,
  main: "server.js",
  dependencies: packageJson.dependencies,
  scripts: {
    start: "node server.js",
  },
};

fs.writeFileSync(
  path.join(distDir, "package.json"),
  JSON.stringify(distPackageJson, null, 2)
);
console.log("✅ package.jsonをdistフォルダに生成しました");
