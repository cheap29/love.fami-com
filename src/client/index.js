import "./styles.css";
// データを直接importする
import gamesData from "../../data/data.json";

// アプリケーションのメインクラス
class FamicomSearchApp {
  constructor() {
    this.games = gamesData; // 直接データを使用
    this.sortedGames = [];
    this.init();
  }

  async init() {
    this.loadData();
    this.setupEventListeners();
  }

  loadData() {
    // サーバーAPIを使わずに直接データを処理
    this.sortedGames = this.sortGamesByJapanese(this.games);
    this.renderGames(this.games);
    this.renderGameList();
  }

  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", () => this.handleSearch());

    // 50音順一覧関連のイベントリスナーを追加
    const listToggle = document.getElementById("gameListToggle");
    const listClose = document.getElementById("gameListClose");
    const overlay = document.getElementById("gameListOverlay");

    listToggle.addEventListener("click", () => this.toggleGameList());
    listClose.addEventListener("click", () => this.hideGameList());

    // オーバーレイ背景クリックで閉じる
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.hideGameList();
      }
    });

    // ESCキーで閉じる
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.hideGameList();
      }
    });
  }

  // 50音順ソート関数
  sortGamesByJapanese(games) {
    return [...games].sort((a, b) => {
      return a.title.localeCompare(b.title, "ja", { numeric: true });
    });
  }

  // 50音順一覧の表示/非表示切り替え
  toggleGameList() {
    const overlay = document.getElementById("gameListOverlay");
    if (overlay.classList.contains("hidden")) {
      this.showGameList();
    } else {
      this.hideGameList();
    }
  }

  showGameList() {
    const overlay = document.getElementById("gameListOverlay");
    overlay.classList.remove("hidden");
    document.body.style.overflow = "hidden"; // 背景スクロール防止
  }

  hideGameList() {
    const overlay = document.getElementById("gameListOverlay");
    overlay.classList.add("hidden");
    document.body.style.overflow = ""; // スクロール復元
  }

  // 50音順一覧のレンダリング
  renderGameList() {
    const container = document.getElementById("gameListContent");
    const countElement = document.getElementById("gameCount");

    if (this.sortedGames.length === 0) {
      container.innerHTML =
        '<div class="loading">ゲームデータがありません</div>';
      countElement.textContent = "0件";
      return;
    }

    // 件数を更新
    countElement.textContent = `${this.sortedGames.length}件`;

    const gamesHtml = this.sortedGames
      .map(
        (game, index) => `
      <div class="game-list-item" data-game-index="${index}">
        <div class="game-list-item-content">
          <div class="game-list-item-title">${game.title}</div>
          <div class="game-list-item-meta">${game.publisher} · ${game.releaseYear}年 · ${game.genre}</div>
        </div>
      </div>
    `
      )
      .join("");

    container.innerHTML = gamesHtml;

    // 一覧アイテムクリックでメイン画面にスクロール
    container.addEventListener("click", (e) => {
      const item = e.target.closest(".game-list-item");
      if (item) {
        const gameIndex = parseInt(item.dataset.gameIndex);
        const game = this.sortedGames[gameIndex];
        this.scrollToGame(game);
        this.hideGameList();
      }
    });
  }

  // 指定ゲームまでスクロール
  scrollToGame(targetGame) {
    const gameCards = document.querySelectorAll(".game");
    for (const card of gameCards) {
      const titleElement = card.querySelector(".game-title-link");
      if (
        titleElement &&
        titleElement.textContent.trim() === targetGame.title
      ) {
        card.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // ハイライト効果を追加
        card.style.border = "2px solid #0969da";
        setTimeout(() => {
          card.style.border = "1px solid #d1d9e0";
        }, 2000);
        break;
      }
    }
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
