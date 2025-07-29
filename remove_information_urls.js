const fs = require("fs");
const path = require("path");

// JSONファイルを読み込み
const jsonPath = path.join(__dirname, "data", "games.json");
const games = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// 各ゲームからinformationURLsキーを削除
let removedCount = 0;
games.forEach((game) => {
  if (game.informationURLs !== undefined) {
    delete game.informationURLs;
    removedCount++;
  }
});

// 修正したJSONを保存
fs.writeFileSync(jsonPath, JSON.stringify(games, null, 2), "utf8");

console.log("✅ informationURLsキーを削除しました！");
console.log(`📊 総ゲーム数: ${games.length}件`);
console.log(`🗑️ 削除したキー数: ${removedCount}件`);
