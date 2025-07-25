import "./styles.css";

// アプリケーションのメインクラス
class FamicomSearchApp {
  constructor() {
    this.games = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
  }

  async loadData() {
    try {
      const response = await fetch("/api/games");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.games = await response.json();
      this.renderGames(this.games);
    } catch (error) {
      console.error("データ読み込み失敗:", error);
      this.showError("データの読み込みに失敗しました");
    }
  }

  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", () => this.handleSearch());
  }

  handleSearch() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const filteredGames = this.games.filter((game) => {
      const searchText = (
        game.title +
        " " +
        game.description +
        " " +
        (game.reviewComments || []).join(" ")
      ).toLowerCase();
      return searchText.includes(query);
    });
    this.renderGames(filteredGames);
  }

  renderGames(gamesList) {
    const container = document.getElementById("gamesContainer");

    if (gamesList.length === 0) {
      container.innerHTML =
        '<div class="loading">検索結果が見つかりませんでした</div>';
      return;
    }

    container.innerHTML = gamesList
      .map((game) => this.createGameCard(game))
      .join("");

    // 画像のエラーハンドリングを設定
    this.setupImageErrorHandling();
  }

  createGameCard(game) {
    const reviewsHtml = (game.reviewComments || [])
      .map((comment) => `<li class="review-item">${comment}</li>`)
      .join("");

    const imageUrl = game.imageUrl || "img/noimage.png";
    const altText = `${game.title}イメージ`;

    const titleElement = game.wikipediaUrl
      ? `<a href="${game.wikipediaUrl}" target="_blank" rel="noopener noreferrer" class="game-title-link" aria-label="${game.title}の詳細情報（新しいタブで開きます）">
          ${game.title}
          <span class="external-link-icon" aria-hidden="true">🔗</span>
        </a>`
      : `<h2 class="game-title-link" style="color: #24292f; text-decoration: none;">${game.title}</h2>`;

    return `
      <div class="game">
        <div class="game-image">
          <img src="${imageUrl}" alt="${altText}" data-fallback="img/noimage.png">
        </div>
        <div class="game-content">
          ${titleElement}
          <span class="credibility">(信憑性: ${game.credibility}%)</span>
          
          <div class="game-meta">
            <div class="meta-item">
              <span class="meta-label">メーカー:</span>
              <span>${game.publisher}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">発売年:</span>
              <span>${game.releaseYear}年</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">ジャンル:</span>
              <span>${game.genre}</span>
            </div>
          </div>
          
          <div class="game-description">${game.description}</div>
          
          <h4 class="reviews-title">レビュー・コメント:</h4>
          <ul class="reviews-list">${reviewsHtml}</ul>
          
          ${
            game.funFacts && game.funFacts.length > 0
              ? `
            <h4 class="fun-facts-title">豆知識:</h4>
            <ul class="fun-facts-list">${game.funFacts
              .map((fact) => `<li class="fun-fact-item">${fact}</li>`)
              .join("")}</ul>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  setupImageErrorHandling() {
    const images = document.querySelectorAll(".game-image img");
    images.forEach((img) => {
      img.addEventListener("error", (e) => {
        const fallback = e.target.dataset.fallback;
        if (e.target.src !== fallback) {
          e.target.src = fallback;
        }
      });
    });
  }

  showError(message) {
    const container = document.getElementById("gamesContainer");
    container.innerHTML = `<div class="loading">${message}</div>`;
  }
}

// DOMが読み込まれたらアプリを開始
document.addEventListener("DOMContentLoaded", () => {
  new FamicomSearchApp();
});
