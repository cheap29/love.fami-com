# ファミコンソフト検索アプリ

レトロゲーム愛好家のためのファミコンソフト検索アプリです。懐かしいゲームの情報を手描き風の UI で楽しく検索できます。

## 特徴

- 📊 ファミコンソフトの詳細情報（メーカー、発売年、ジャンル等）
- 🔍 タイトル・説明・レビューコメントでの検索機能
- 🎨 手描き風の温かみのあるデザイン
- 📱 レスポンシブ対応
- ⚡ 高速なフィルタリング機能

## 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **バックエンド**: Node.js, Express.js
- **ビルドツール**: Webpack 5
- **スタイル**: Hand-drawn 風カスタム CSS

## セットアップ

### 必要環境

- Node.js 18.x 以上
- npm 9.x 以上

### インストール

```bash
# 依存関係のインストール
npm install
```

## 開発

### 開発サーバーの起動

```bash
# サーバーとクライアントを同時に起動
npm run dev

# または個別に起動
npm run dev:server  # バックエンドのみ (http://localhost:3000)
npm run dev:client  # フロントエンドのみ (http://localhost:3001)
```

### ビルド

```bash
# プロダクション用ビルド
npm run build

# ビルド結果のクリーンアップ
npm clean
```

### 本番環境での起動

```bash
# ビルド後に本番サーバーを起動
npm start
```

## プロジェクト構造

```
love.fami-com/
├── src/
│   ├── client/          # フロントエンドソース
│   │   ├── index.html   # HTMLテンプレート
│   │   ├── index.js     # メインJavaScript
│   │   └── styles.css   # スタイルシート
│   └── server.js        # Express.jsサーバー
├── data/
│   └── data.json        # ゲームデータ
├── dist/                # ビルド出力先
│   ├── public/          # 静的ファイル
│   ├── server.js        # ビルド済みサーバー
│   └── package.json     # 本番用パッケージ設定
├── webpack.config.js    # Webpack設定
├── build-server.js      # サーバービルドスクリプト
└── package.json         # 依存関係・スクリプト設定
```

## API 仕様

### GET /api/games

全ゲームデータを取得

### GET /api/games/search?q={query}

検索クエリによるゲームデータのフィルタリング

## デプロイ

1. プロダクションビルドを実行

   ```bash
   npm run build
   ```

2. `dist/` フォルダの内容をサーバーにアップロード

3. サーバーで依存関係をインストール

   ```bash
   cd dist
   npm install --production
   ```

4. アプリケーションを起動
   ```bash
   npm start
   ```

## ライセンス

MIT License
