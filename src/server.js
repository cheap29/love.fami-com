const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// セキュリティとCORS設定
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);
app.use(cors());
app.use(express.json());

// 静的ファイルの配信（開発時はdist/public、本番時はpublic）
const staticPath =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "public")
    : path.join(__dirname, "..", "dist", "public");
app.use(express.static(staticPath));

// APIエンドポイント
app.get("/api/games", (req, res) => {
  try {
    const dataPath =
      process.env.NODE_ENV === "production"
        ? path.join(__dirname, "public", "data", "data.json")
        : path.join(__dirname, "..", "data", "data.json");
    const gamesData = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    res.json(gamesData);
  } catch (error) {
    console.error("データ読み込みエラー:", error);
    res.status(500).json({ error: "データの読み込みに失敗しました" });
  }
});

// 検索API
app.get("/api/games/search", (req, res) => {
  try {
    const query = req.query.q?.toLowerCase() || "";
    const dataPath =
      process.env.NODE_ENV === "production"
        ? path.join(__dirname, "public", "data", "data.json")
        : path.join(__dirname, "..", "data", "data.json");
    const gamesData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    const filteredGames = gamesData.filter((game) => {
      const searchText = (
        game.title +
        " " +
        game.description +
        " " +
        (game.reviewComments || []).join(" ")
      ).toLowerCase();
      return searchText.includes(query);
    });

    res.json(filteredGames);
  } catch (error) {
    console.error("検索エラー:", error);
    res.status(500).json({ error: "検索に失敗しました" });
  }
});

// SPAのためのcatch-all
app.get("*", (req, res) => {
  const indexPath =
    process.env.NODE_ENV === "production"
      ? path.join(__dirname, "public", "index.html")
      : path.join(__dirname, "..", "dist", "public", "index.html");
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`🚀 サーバーがポート${PORT}で起動しました`);
  console.log(`http://localhost:${PORT} でアクセスできます`);
});
