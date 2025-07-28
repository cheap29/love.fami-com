import "./styles.css";

// アプリケーションのメインクラス
class FamicomSearchApp {
  constructor() {
    this.games = [];
    this.sortedGames = [];
    this.init();
  }

  async init() {
    await this.loadData();
    this.setupEventListeners();
  }

  async loadData() {
    try {
      // WordPress APIからデータを取得（相対パス）
      const response = await fetch("/wp-json/famicom/v1/games");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.games = await response.json();
      this.sortedGames = this.sortGamesByJapanese(this.games);
      this.renderGames(this.games);
      this.renderGameList();
    } catch (error) {
      console.error("データ読み込み失敗:", error);
      this.showError("データの読み込みに失敗しました");
    }
  }

  // 50音順でソートする関数
  sortGamesByJapanese(games) {
    return games.sort((a, b) => {
      const titleA = a.title.replace(/[ァ-ヶ]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) + 0x60)
      );
      const titleB = b.title.replace(/[ァ-ヶ]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) + 0x60)
      );
      return titleA.localeCompare(titleB, "ja");
    });
  }

  // イベントリスナーの設定
  setupEventListeners() {
    const searchInput = document.getElementById("searchInput");
    const gameListToggle = document.getElementById("gameListToggle");
    const addGameBtn = document.getElementById("addGameBtn");
    const gameListClose = document.getElementById("gameListClose");
    const modalClose = document.getElementById("modalClose");
    const saveGameBtn = document.getElementById("saveGameBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    // 検索機能
    searchInput.addEventListener("input", () => this.filterGames());

    // 50音順一覧トグル
    gameListToggle.addEventListener("click", () => this.showGameList());
    gameListClose.addEventListener("click", () => this.hideGameList());

    // ゲーム追加モーダル
    addGameBtn.addEventListener("click", () => this.showAddGameModal());
    modalClose.addEventListener("click", () => this.hideAddGameModal());
    cancelBtn.addEventListener("click", () => this.hideAddGameModal());
    saveGameBtn.addEventListener("click", () => this.saveGameData());
  }

  // ゲーム一覧の表示
  renderGames(games) {
    const container = document.getElementById("gamesContainer");
    container.innerHTML = "";

    if (games.length === 0) {
      container.innerHTML =
        '<div class="loading">ゲームが見つかりませんでした</div>';
      return;
    }

    games.forEach((game) => {
      const gameElement = this.createGameElement(game);
      container.appendChild(gameElement);
    });
  }

  // ゲーム要素の作成
  createGameElement(game) {
    const div = document.createElement("div");
    div.className = "game";
    div.dataset.title = game.title.toLowerCase();

    const imageUrl = game.imageUrl || "./img/noimage.png";
    const wikipediaUrl = game.wikipediaUrl || "#";

    div.innerHTML = `
      <div class="game-image">
        <img src="${imageUrl}" alt="${
      game.title
    }" onerror="this.src='./img/noimage.png'">
      </div>
      <div class="game-content">
        <a href="${wikipediaUrl}" target="_blank" class="game-title-link">
          ${game.title}<span class="external-link-icon">↗</span>
        </a>
        <span class="credibility">(信憑性: ${game.credibility}%)</span>
        <div class="game-meta">
          <span class="meta-item">
            <span class="meta-label">メーカー:</span> ${game.publisher}
          </span>
          <span class="meta-item">
            <span class="meta-label">発売年:</span> ${game.releaseYear}年
          </span>
          <span class="meta-item">
            <span class="meta-label">ジャンル:</span> ${game.genre}
          </span>
        </div>
        <div class="game-description">${game.description}</div>
        ${this.createReviewsSection(game)}
        ${this.createFunFactsSection(game)}
      </div>
    `;

    return div;
  }

  // レビューセクションの作成
  createReviewsSection(game) {
    if (!game.reviewComments || game.reviewComments.length === 0) return "";

    const reviewsHtml = game.reviewComments
      .map((review) => `<li class="review-item">${review}</li>`)
      .join("");

    return `
      <h4 class="reviews-title">レビュー・コメント:</h4>
      <ul class="reviews-list">${reviewsHtml}</ul>
    `;
  }

  // 豆知識セクションの作成
  createFunFactsSection(game) {
    if (!game.funFacts || game.funFacts.length === 0) return "";

    const factsHtml = game.funFacts
      .map((fact) => `<li class="fun-fact-item">${fact}</li>`)
      .join("");

    return `
      <h4 class="fun-facts-title">豆知識:</h4>
      <ul class="fun-facts-list">${factsHtml}</ul>
    `;
  }

  // 50音順一覧の表示
  renderGameList() {
    const container = document.getElementById("gameListContent");
    const countElement = document.getElementById("gameCount");

    container.innerHTML = "";
    countElement.textContent = `${this.sortedGames.length}件`;

    this.sortedGames.forEach((game) => {
      const item = document.createElement("div");
      item.className = "game-list-item";
      item.innerHTML = `
        <div class="game-list-item-content">
          <div class="game-list-item-title">${game.title}</div>
          <div class="game-list-item-meta">${game.publisher} / ${game.releaseYear}年</div>
        </div>
      `;

      item.addEventListener("click", () => {
        this.scrollToGame(game.title);
        this.hideGameList();
      });

      container.appendChild(item);
    });
  }

  // ゲームまでスクロール
  scrollToGame(title) {
    const gameElement = document.querySelector(
      `[data-title="${title.toLowerCase()}"]`
    );
    if (gameElement) {
      gameElement.scrollIntoView({ behavior: "smooth", block: "center" });
      gameElement.style.backgroundColor = "#fff3cd";
      setTimeout(() => {
        gameElement.style.backgroundColor = "";
      }, 2000);
    }
  }

  // ゲームフィルタリング
  filterGames() {
    const query = document.getElementById("searchInput").value.toLowerCase();
    const games = document.querySelectorAll(".game");

    games.forEach((game) => {
      const title = game.dataset.title;
      const isVisible = title.includes(query);
      game.style.display = isVisible ? "flex" : "none";
    });
  }

  // 50音順一覧の表示
  showGameList() {
    document.getElementById("gameListOverlay").classList.remove("hidden");
  }

  // 50音順一覧の非表示
  hideGameList() {
    document.getElementById("gameListOverlay").classList.add("hidden");
  }

  // ゲーム追加モーダルの表示
  showAddGameModal() {
    document.getElementById("addGameModal").classList.remove("hidden");
  }

  // ゲーム追加モーダルの非表示
  hideAddGameModal() {
    document.getElementById("addGameModal").classList.add("hidden");
    document.getElementById("gameJsonTextarea").value = "";
  }

  // エラー表示
  showError(message) {
    const container = document.getElementById("gamesContainer");
    container.innerHTML = `<div class="loading">${message}</div>`;
  }

  async saveGameData() {
    const textarea = document.getElementById("gameJsonTextarea");
    const jsonText = textarea.value.trim();

    try {
      const newGame = JSON.parse(jsonText);

      if (!newGame.title || !newGame.publisher || !newGame.releaseYear) {
        alert("タイトル、メーカー、発売年は必須です。");
        return;
      }

      // WordPress APIに送信（相対パス）
      const response = await fetch("/wp-json/famicom/v1/games", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newGame),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        alert("ゲームデータを追加しました！");
        this.hideAddGameModal();
        this.loadData(); // データを再読み込み
      } else {
        alert(`エラー: ${result.message}`);
      }
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました。");
    }
  }
}

// DOMが読み込まれたらアプリを開始
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  new FamicomSearchApp();
});
