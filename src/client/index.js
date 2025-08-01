import "./styles.css";

// アプリケーションのメインクラス
class FamicomSearchApp {
  constructor() {
    this.games = [];
    this.sortedGames = [];
    this.comments = [];
    this.isAdmin = this.checkAdminParameter();
    this.init();
  }

  // 管理者パラメータをチェック
  checkAdminParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("admin") === "2813";
  }

  async init() {
    await this.loadData();
    await this.loadComments();
    this.setupEventListeners();
    this.updateStructuredData();
    this.updateAdminUI();
  }

  // 管理者UIの表示/非表示を更新
  updateAdminUI() {
    const addGameBtn = document.getElementById("addGameBtn");
    if (addGameBtn) {
      addGameBtn.style.display = this.isAdmin ? "block" : "none";
    }
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
      this.updateStructuredData();
    } catch (error) {
      console.error("データ読み込み失敗:", error);
      this.showError("データの読み込みに失敗しました");
    }
  }

  // コメントデータの読み込み
  async loadComments() {
    try {
      const response = await fetch("/wp-json/famicom/v1/comments");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.comments = data.comments || [];
      this.renderComments();
    } catch (error) {
      console.error("コメント読み込み失敗:", error);
      this.comments = [];
      this.renderComments();
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

  // 構造化データを動的に更新
  updateStructuredData() {
    const activeGames = this.games.filter((game) => game.delete !== 1);

    // ItemListの構造化データを更新
    const itemListData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "ファミコンゲーム一覧",
      description: "1980年代ファミリーコンピュータのゲーム一覧",
      numberOfItems: activeGames.length,
      itemListElement: activeGames.slice(0, 10).map((game, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "VideoGame",
          name: game.title,
          description: game.description,
          publisher: game.publisher,
          datePublished: game.releaseYear.toString(),
          genre: game.genre,
          image: game.imageUrl || "./img/noimage.png",
        },
      })),
    };

    // 既存の構造化データを更新
    let existingScript = document.querySelector(
      'script[type="application/ld+json"]:nth-of-type(2)'
    );
    if (existingScript) {
      existingScript.textContent = JSON.stringify(itemListData, null, 2);
    } else {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.textContent = JSON.stringify(itemListData, null, 2);
      document.head.appendChild(script);
    }
  }

  // ページタイトルとメタタグを更新
  updatePageMeta(searchQuery = "") {
    const baseTitle =
      "ファミコンソフトメモリアル - 1980年代ファミリーコンピュータ懐かしいゲーム情報検索";
    const baseDescription =
      "1980年代ファミリーコンピュータ（ファミコン）の懐かしいゲーム情報を検索できるサイト。ドンキーコング、スーパーマリオブラザーズ、ゼビウスなど名作ゲームの詳細情報、レビュー、豆知識を掲載。レトロゲーム愛好家必見のファミコンソフトデータベース。";

    if (searchQuery) {
      document.title = `「${searchQuery}」の検索結果 - ${baseTitle}`;
      document
        .querySelector('meta[name="description"]')
        .setAttribute(
          "content",
          `「${searchQuery}」で検索したファミコンゲームの結果を表示。${baseDescription}`
        );
    } else {
      document.title = baseTitle;
      document
        .querySelector('meta[name="description"]')
        .setAttribute("content", baseDescription);
    }
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
    const gameListClose = document.getElementById("gameListClose");

    // 検索機能
    searchInput.addEventListener("input", () => {
      this.filterGames();
      // 検索時にメタタグを更新
      this.updatePageMeta(searchInput.value);
    });

    // 50音順一覧トグル
    gameListToggle.addEventListener("click", () => this.showGameList());
    gameListClose.addEventListener("click", () => this.hideGameList());

    // 掲示板機能のイベントリスナーを設定
    this.setupBBSEventListeners();

    // 管理者機能のイベントリスナー（管理者の場合のみ設定）
    if (this.isAdmin) {
      this.setupAdminEventListeners();
    }
  }

  // 掲示板機能のイベントリスナー設定
  setupBBSEventListeners() {
    const bbsToggleBtn = document.getElementById("bbsToggleBtn");
    const bbsClose = document.getElementById("bbsClose");
    const bbsOverlay = document.getElementById("bbsOverlay");
    const postCommentBtn = document.getElementById("postCommentBtn");
    const commentText = document.getElementById("commentText");
    const commentName = document.getElementById("commentName");

    // 掲示板の表示/非表示
    if (bbsToggleBtn) {
      bbsToggleBtn.addEventListener("click", () => this.showBBS());
    }
    if (bbsClose) {
      bbsClose.addEventListener("click", () => this.hideBBS());
    }
    if (bbsOverlay) {
      bbsOverlay.addEventListener("click", (e) => {
        if (e.target === bbsOverlay) {
          this.hideBBS();
        }
      });
    }

    // コメント投稿
    if (postCommentBtn) {
      postCommentBtn.addEventListener("click", () => this.postComment());
    }

    // 文字数カウント
    if (commentText) {
      commentText.addEventListener("input", () => this.updateCommentCount());
    }
  }

  // 管理者機能のイベントリスナー設定
  setupAdminEventListeners() {
    const addGameBtn = document.getElementById("addGameBtn");
    const gameManagementClose = document.getElementById("gameManagementClose");
    const saveGameBtn = document.getElementById("saveGameBtn");
    const clearFormBtn = document.getElementById("clearFormBtn");
    const downloadJsonBtn = document.getElementById("downloadJsonBtn");
    const uploadJsonInput = document.getElementById("uploadJsonInput");

    // ゲーム管理モーダル
    addGameBtn.addEventListener("click", () => this.showGameManagementModal());
    gameManagementClose.addEventListener("click", () =>
      this.hideGameManagementModal()
    );

    // ゲーム追加関連
    saveGameBtn.addEventListener("click", () => this.saveGameData());
    clearFormBtn.addEventListener("click", () => this.clearGameForm());

    // ファイル操作関連
    downloadJsonBtn.addEventListener("click", () => this.downloadGamesJson());
    uploadJsonInput.addEventListener("change", (event) =>
      this.uploadGamesJson(event)
    );
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
    const amazonUrl = game.amazonUrl;
    const rakutenUrl = game.rakutenUrl;

    // wikipediaUrlがnullや空の場合はリンクを張らない
    const titleElement =
      wikipediaUrl && wikipediaUrl.trim() !== ""
        ? `<a href="${wikipediaUrl}" target="_blank" class="game-title-link" rel="noopener noreferrer">
           ${game.title}<i class="fas fa-external-link-alt external-link-icon"></i>
         </a>`
        : `<span class="game-title">${game.title}</span>`;

    // アフィリエイト表示の判定（楽天優先）
    let imageElement;
    if (
      rakutenUrl &&
      rakutenUrl.trim() !== "" &&
      amazonUrl &&
      amazonUrl.trim() !== ""
    ) {
      // 楽天とAmazonの両方がある場合は両方表示
      imageElement = `
        <div class="affiliate-container">
          <div class="rakuten-affiliate">
            ${rakutenUrl}
          </div>
          <div class="amazon-affiliate">
            ${this.createAffiliateElement(amazonUrl, game.title)}
          </div>
        </div>
      `;
    } else if (rakutenUrl && rakutenUrl.trim() !== "") {
      // 楽天アフィリエイトHTMLをそのまま表示
      imageElement = rakutenUrl;
    } else if (amazonUrl && amazonUrl.trim() !== "") {
      // Amazonアフィリエイト表示
      imageElement = this.createAffiliateElement(amazonUrl, game.title);
    } else {
      // 通常の画像表示
      imageElement = `<img src="${imageUrl}" alt="${game.title}" onerror="this.src='./img/noimage.png'" loading="lazy">`;
    }

    div.innerHTML = `
      <div class="game-image">
        ${imageElement}
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

  // アフィリエイト要素の作成
  createAffiliateElement(amazonUrl, gameTitle) {
    return `
      <div class="affiliate-container">
        <a href="${amazonUrl}" target="_blank" rel="noopener noreferrer" class="affiliate-link">
          <div class="affiliate-content">
            <div class="affiliate-icon">🛒</div>
            <div class="affiliate-text">
              <div class="affiliate-title">Amazonで購入</div>
              <div class="affiliate-subtitle">${gameTitle}</div>
            </div>
          </div>
        </a>
      </div>
    `;
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

  // ゲーム管理一覧の表示（管理者のみ）
  renderManagementGameList() {
    if (!this.isAdmin) return;

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

  // ゲーム削除フラグの切り替え（管理者のみ）
  async toggleGameDelete(title) {
    if (!this.isAdmin) return;

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
        this.updateStructuredData();

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

  // ゲーム管理モーダルの表示（管理者のみ）
  showGameManagementModal() {
    if (!this.isAdmin) return;

    document.getElementById("gameManagementModal").classList.remove("hidden");
    this.renderManagementGameList();
  }

  // ゲーム管理モーダルの非表示
  hideGameManagementModal() {
    document.getElementById("gameManagementModal").classList.add("hidden");
    this.clearGameForm();
  }

  // 掲示板の表示
  showBBS() {
    const overlay = document.getElementById("bbsOverlay");
    if (overlay) {
      overlay.classList.remove("hidden");
    }
  }

  // 掲示板の非表示
  hideBBS() {
    const overlay = document.getElementById("bbsOverlay");
    if (overlay) {
      overlay.classList.add("hidden");
    }
  }

  // コメント一覧の表示
  renderComments() {
    const container = document.getElementById("commentsList");
    if (!container) return;

    if (this.comments.length === 0) {
      container.innerHTML =
        '<div class="loading">まだコメントがありません</div>';
      return;
    }

    container.innerHTML = "";
    this.comments.forEach((comment) => {
      const commentElement = this.createCommentElement(comment);
      container.appendChild(commentElement);
    });
  }

  // コメント要素の作成
  createCommentElement(comment) {
    const div = document.createElement("div");
    div.className = "comment-item";

    const date = new Date(comment.date);
    const formattedDate = date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    div.innerHTML = `
      <div class="comment-header">
        <span class="comment-author">${this.escapeHtml(comment.name)}</span>
        <span class="comment-date">${formattedDate}</span>
      </div>
      <div class="comment-text">${this.escapeHtml(comment.text)}</div>
    `;

    return div;
  }

  // HTMLエスケープ
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  // 文字数カウント更新
  updateCommentCount() {
    const commentText = document.getElementById("commentText");
    const commentCount = document.getElementById("commentCount");
    if (!commentText || !commentCount) return;

    const count = commentText.value.length;
    commentCount.textContent = `${count}/500文字`;

    if (count > 450) {
      commentCount.style.color = "#d73a49";
    } else if (count > 400) {
      commentCount.style.color = "#f6a434";
    } else {
      commentCount.style.color = "#656d76";
    }
  }

  // コメント投稿
  async postComment() {
    const nameInput = document.getElementById("commentName");
    const textInput = document.getElementById("commentText");
    const postBtn = document.getElementById("postCommentBtn");

    if (!nameInput || !textInput || !postBtn) return;

    const name = nameInput.value.trim();
    const text = textInput.value.trim();

    if (!name) {
      this.showToast("お名前を入力してください", "error");
      nameInput.focus();
      return;
    }

    if (!text) {
      this.showToast("コメントを入力してください", "error");
      textInput.focus();
      return;
    }

    if (name.length > 50) {
      this.showToast("お名前は50文字以内で入力してください", "error");
      return;
    }

    if (text.length > 500) {
      this.showToast("コメントは500文字以内で入力してください", "error");
      return;
    }

    // 投稿ボタンを無効化
    postBtn.disabled = true;
    postBtn.textContent = "📤 投稿中...";

    try {
      const response = await fetch("/wp-json/famicom/v1/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          text: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this.showToast("コメントを投稿しました！", "success");

        // フォームをクリア
        nameInput.value = "";
        textInput.value = "";
        this.updateCommentCount();

        // コメント一覧を更新
        await this.loadComments();
      } else {
        this.showToast(data.message || "投稿に失敗しました", "error");
      }
    } catch (error) {
      console.error("コメント投稿失敗:", error);
      this.showToast("投稿に失敗しました", "error");
    } finally {
      // 投稿ボタンを有効化
      postBtn.disabled = false;
      postBtn.textContent = "📤 投稿";
    }
  }

  // フォームをクリア
  clearGameForm() {
    const textarea = document.getElementById("gameJsonTextarea");
    if (textarea) {
      textarea.value = "";
    }
  }

  // エラー表示
  showError(message) {
    const container = document.getElementById("gamesContainer");
    container.innerHTML = `<div class="loading">${message}</div>`;
  }

  // ゲームデータを保存（管理者のみ）
  async saveGameData() {
    if (!this.isAdmin) return;

    const textarea = document.getElementById("gameJsonTextarea");
    const jsonText = textarea.value.trim();

    if (!jsonText) {
      this.showToast("JSONデータを入力してください。", "warning");
      return;
    }

    try {
      const newGame = JSON.parse(jsonText);

      // 必須項目のチェック
      if (!newGame.title || !newGame.publisher || !newGame.releaseYear) {
        this.showToast("タイトル、メーカー、発売年は必須です。", "warning");
        return;
      }

      // 発売年の範囲チェック
      if (newGame.releaseYear < 1983 || newGame.releaseYear > 1994) {
        this.showToast(
          "発売年は1983年から1994年の間で入力してください。",
          "warning"
        );
        return;
      }

      // 重複チェック
      const existingGame = this.games.find(
        (game) => game.title === newGame.title
      );
      if (existingGame) {
        this.showToast(
          `「${newGame.title}」は既に登録されています。`,
          "warning"
        );
        return;
      }

      // deleteキーが設定されていない場合は0を設定
      if (newGame.delete === undefined) {
        newGame.delete = 0;
      }

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
        this.showToast(`「${newGame.title}」を追加しました！`, "success");
        this.clearGameForm();
        this.hideGameManagementModal();
        this.loadData(); // データを再読み込み
      } else {
        this.showToast(`エラー: ${result.message}`, "error");
      }
    } catch (error) {
      if (error.name === "SyntaxError") {
        this.showToast("JSONの形式が正しくありません。", "error");
      } else {
        console.error("保存エラー:", error);
        this.showToast("保存に失敗しました。", "error");
      }
    }
  }

  // ゲームデータをJSONファイルとしてダウンロード
  downloadGamesJson() {
    if (!this.isAdmin) return;

    const gamesJson = JSON.stringify(this.games, null, 2);
    const blob = new Blob([gamesJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "famicom_games.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showToast("ゲームデータをダウンロードしました。", "success");
  }

  // ゲームデータをJSONファイルとしてアップロード
  async uploadGamesJson(event) {
    if (!this.isAdmin) return;

    const file = event.target.files[0];

    if (!file) {
      this.showToast("ファイルを選択してください。", "warning");
      return;
    }

    if (file.type !== "application/json") {
      this.showToast("JSONファイルのみを選択してください。", "warning");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const uploadedGames = JSON.parse(event.target.result);

          // データの検証
          if (!Array.isArray(uploadedGames)) {
            this.showToast("有効なゲームデータ配列ではありません。", "error");
            return;
          }

          // 必須フィールドのチェック
          for (let i = 0; i < uploadedGames.length; i++) {
            const game = uploadedGames[i];
            if (!game.title || !game.publisher || !game.releaseYear) {
              this.showToast(
                `ゲーム ${i + 1} に必須フィールドが不足しています。`,
                "error"
              );
              return;
            }
          }

          // WordPress APIに送信してサーバー側に保存
          const response = await fetch(
            "/wp-json/famicom/v1/games/bulk-update",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ games: uploadedGames }),
            }
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (result.success) {
            // ローカルデータを更新
            this.games = uploadedGames;
            this.sortedGames = this.sortGamesByJapanese(this.games);

            // UIを更新
            this.renderGames(this.games);
            this.renderManagementGameList();
            this.renderGameList();
            this.updateStructuredData();

            this.showToast(
              `${uploadedGames.length}件のゲームデータをアップロードしました。`,
              "success"
            );
          } else {
            this.showToast(`エラー: ${result.message}`, "error");
          }
        } catch (parseError) {
          console.error("JSON解析エラー:", parseError);
          this.showToast("JSONファイルの形式が正しくありません。", "error");
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error("アップロードエラー:", error);
      this.showToast("アップロードに失敗しました。", "error");
    }

    // ファイル入力をリセット
    event.target.value = "";
  }
}

// DOMが読み込まれたらアプリを開始
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded");
  new FamicomSearchApp();
});
