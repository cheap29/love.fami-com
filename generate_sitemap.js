const fs = require("fs");
const path = require("path");

// JSONファイルを読み込み
const jsonPath = path.join(__dirname, "data", "games.json");
const games = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// アクティブなゲームのみをフィルタリング
const activeGames = games.filter((game) => game.delete !== 1);

// sitemap.xmlを生成
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://love.fami-com.com/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  ${activeGames
    .map(
      (game) => `
  <url>
    <loc>https://love.fami-com.com/?game=${encodeURIComponent(game.title)}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
    )
    .join("")}
</urlset>`;

// sitemap.xmlを保存
const sitemapPath = path.join(__dirname, "dist", "famicon", "sitemap.xml");
fs.writeFileSync(sitemapPath, sitemap, "utf8");

console.log("✅ sitemap.xmlを生成しました！");
console.log(`📊 総ゲーム数: ${activeGames.length}件`);
console.log(`🗺️ 保存先: ${sitemapPath}`);
