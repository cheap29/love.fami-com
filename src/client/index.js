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

  // トースト通知を表示する関数
  showToast(message, type = "info", duration = 4000) {
    const container = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" type="button">✕</button>
    `;

    container.appendChild(toast);

    // アニメーション開始
    setTimeout(() => {
      toast.classList.add("show");
    }, 100);

    // 閉じるボタンのイベント
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      this.hideToast(toast);
    });

    // 自動で閉じる
    if (duration > 0) {
      setTimeout(() => {
        this.hideToast(toast);
      }, duration);
    }
  }

  // トースト通知を非表示にする関数
  hideToast(toast) {
    toast.classList.add("hide");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
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

    // ゲーム管理モーダル関連
    const gameManagementClose = document.getElementById("gameManagementClose");
    const showAddFormBtn = document.getElementById("showAddFormBtn");
    const cancelAddBtn = document.getElementById("cancelAddBtn");
    const registerGameBtn = document.getElementById("registerGameBtn");

    // 検索機能
    searchInput.addEventListener("input", () => this.filterGames());

    // 50音順一覧トグル
    gameListToggle.addEventListener("click", () => this.showGameList());
    gameListClose.addEventListener("click", () => this.hideGameList());

    // ゲーム管理モーダル
    addGameBtn.addEventListener("click", () => this.showGameManagementModal());
    gameManagementClose.addEventListener("click", () =>
      this.hideGameManagementModal()
    );

    // 追加フォーム関連
    showAddFormBtn.addEventListener("click", () => this.showAddGameForm());
    cancelAddBtn.addEventListener("click", () => this.hideAddGameForm());
    registerGameBtn.addEventListener("click", () => this.registerNewGame());

    // 古いゲーム追加モーダル（削除予定）
    modalClose.addEventListener("click", () => this.hideAddGameModal());
    cancelBtn.addEventListener("click", () => this.hideAddGameModal());
    saveGameBtn.addEventListener("click", () => this.saveGameData());
  }

  // ゲーム一覧の表示
  renderGames(games) {
    const container = document.getElementById("gamesContainer");
    container.innerHTML = "";

    // 削除済みゲームを除外
    const activeGames = games.filter((game) => game.delete !== 1);

    if (activeGames.length === 0) {
      container.innerHTML =
        '<div class="loading">ゲームが見つかりませんでした</div>';
      return;
    }

    activeGames.forEach((game) => {
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
    const wikipediaUrl = game.wikipediaUrl;

    // wikipediaUrlがnullや空の場合はリンクを張らない
    const titleElement =
      wikipediaUrl && wikipediaUrl.trim() !== ""
        ? `<a href="${wikipediaUrl}" target="_blank" class="game-title-link">
           ${game.title}<i class="fas fa-external-link-alt external-link-icon"></i>
         </a>`
        : `<span class="game-title">${game.title}</span>`;

    div.innerHTML = `
      <div class="game-image">
        <img src="${imageUrl}" alt="${
      game.title
    }" onerror="this.src='./img/noimage.png'">
      </div>
      <div class="game-content">
        ${titleElement}
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

  // ゲーム管理一覧の表示
  renderManagementGameList() {
    const container = document.getElementById("managementGameList");
    container.innerHTML = "";

    this.sortedGames.forEach((game) => {
      const item = document.createElement("div");
      item.className = `management-game-item ${
        game.delete === 1 ? "deleted" : ""
      }`;

      item.innerHTML = `
        <div class="management-game-info">
          <div class="management-game-title">${game.title}</div>
          <div class="management-game-meta">${game.publisher} / ${
        game.releaseYear
      }年</div>
        </div>
        <div class="management-game-actions">
          <button class="delete-game-btn ${
            game.delete === 1 ? "deleted" : ""
          }" type="button">
            ${game.delete === 1 ? "復元" : "削除"}
          </button>
        </div>
      `;

      const deleteBtn = item.querySelector(".delete-game-btn");
      deleteBtn.addEventListener("click", () =>
        this.toggleGameDelete(game.title)
      );

      container.appendChild(item);
    });
  }

  // ゲーム削除フラグの切り替え
  async toggleGameDelete(title) {
    try {
      const gameIndex = this.games.findIndex((game) => game.title === title);
      if (gameIndex === -1) return;

      const game = this.games[gameIndex];
      const newDeleteValue = game.delete === 1 ? 0 : 1;

      // WordPress APIに送信
      const response = await fetch(`/wp-json/famicom/v1/games/${gameIndex}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ delete: newDeleteValue }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // ローカルデータを更新
        this.games[gameIndex].delete = newDeleteValue;
        this.sortedGames = this.sortGamesByJapanese(this.games);

        // UIを更新（メイン画面も含む）
        this.renderGames(this.games);
        this.renderManagementGameList();
        this.renderGameList();

        const action = newDeleteValue === 1 ? "削除" : "復元";
        this.showToast(`ゲームを${action}しました！`, "success");
      } else {
        this.showToast(`エラー: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("削除エラー:", error);
      this.showToast("削除に失敗しました。", "error");
    }
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

  // ゲーム管理モーダルの表示
  showGameManagementModal() {
    document.getElementById("gameManagementModal").classList.remove("hidden");
    this.renderManagementGameList();
  }

  // ゲーム管理モーダルの非表示
  hideGameManagementModal() {
    document.getElementById("gameManagementModal").classList.add("hidden");
    this.hideAddGameForm();
  }

  // 追加フォームの表示
  showAddGameForm() {
    document.getElementById("addGameForm").classList.remove("hidden");
    document.getElementById("showAddFormBtn").style.display = "none";
  }

  // 追加フォームの非表示
  hideAddGameForm() {
    document.getElementById("addGameForm").classList.add("hidden");
    document.getElementById("showAddFormBtn").style.display = "block";

    // フォームをクリア
    document.getElementById("gameTitle").value = "";
    document.getElementById("gamePublisher").value = "";
    document.getElementById("gameReleaseYear").value = "";
    document.getElementById("gameGenre").value = "";
    document.getElementById("gameDescription").value = "";
  }

  // 新しいゲームを登録
  async registerNewGame() {
    const title = document.getElementById("gameTitle").value.trim();
    const publisher = document.getElementById("gamePublisher").value.trim();
    const releaseYear = parseInt(
      document.getElementById("gameReleaseYear").value
    );
    const genre = document.getElementById("gameGenre").value.trim();
    const description = document.getElementById("gameDescription").value.trim();

    if (!title || !publisher || !releaseYear || !genre || !description) {
      this.showToast("すべての項目を入力してください。", "warning");
      return;
    }

    if (releaseYear < 1983 || releaseYear > 1994) {
      this.showToast(
        "発売年は1983年から1994年の間で入力してください。",
        "warning"
      );
      return;
    }

    const newGame = {
      title,
      publisher,
      releaseYear,
      genre,
      description,
      reviewComments: [],
      funFacts: [],
      priceHistory: {
        originalPrice: "未設定",
        currentPrice: "未設定",
      },
      informationURLs: [],
      imageUrl: "./img/noimage.png",
      wikipediaUrl: "",
      credibility: 90,
      delete: 0,
    };

    try {
      // WordPress APIに送信
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
        this.showToast("ゲームを追加しました！", "success");
        this.hideAddGameForm();
        this.hideGameManagementModal(); // モーダルを閉じる
        this.loadData(); // データを再読み込み
      } else {
        this.showToast(`エラー: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("登録エラー:", error);
      this.showToast("登録に失敗しました。", "error");
    }
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
        this.showToast("タイトル、メーカー、発売年は必須です。", "warning");
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
        this.showToast("ゲームデータを追加しました！", "success");
        this.hideAddGameModal();
        this.loadData(); // データを再読み込み
      } else {
        this.showToast(`エラー: ${result.message}`, "error");
      }
    } catch (error) {
      console.error("保存エラー:", error);
      this.showToast("保存に失敗しました。", "error");
    }
  }
}

// DOMが読み込まれたらアプリを開始
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  new FamicomSearchApp();
});
