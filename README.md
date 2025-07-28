# ファミコンソフトメモリアル

レトロゲーム愛好家のためのファミコンソフトメモリアルサイトです。懐かしいゲームの情報を手描き風の UI で楽しく検索・管理できます。

## 特徴

- 📊 ファミコンソフトの詳細情報（メーカー、発売年、ジャンル等）
- 🔍 タイトル・説明・レビューコメントでの検索機能
- 📋 50 音順ゲーム一覧オーバーレイ表示
- ➕ ゲームデータの動的追加機能
- 🎨 手描き風の温かみのあるデザイン
- 📱 レスポンシブ対応
- ⚡ 高速なフィルタリング機能
- 🌐 静的サイト対応（CDN 配信可能）

## 技術スタック

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **バックエンド**: PHP (WordPress REST API 対応)
- **ビルドツール**: Webpack 5
- **スタイル**: Hand-drawn 風カスタム CSS
- **デプロイ**: 静的サイト（GitHub Pages, Netlify, Vercel 等対応）

## セットアップ

### 必要環境

- Node.js 18.x 以上
- npm 9.x 以上
- PHP 7.4 以上（WordPress API 使用時）

### インストール

```bash
# 依存関係のインストール
npm install
```

## 開発

### 開発サーバーの起動

```bash
# 静的サイトとして開発サーバー起動
npm run dev
# → http://localhost:8080 でアクセス
```

### ビルド

```bash
# プロダクション用ビルド
npm run build

# ビルド結果のクリーンアップ
npm run clean
```

### 静的サイトとして起動

```bash
# ビルド後に静的サイトとして起動
npm start
# → http://localhost:3000 でアクセス
```

## プロジェクト構造

```
love.fami-com/
├── src/
│   └── client/              # フロントエンドソース
│       ├── index.html       # HTMLテンプレート
│       ├── index.js         # メインJavaScript
│       └── styles.css       # スタイルシート
├── server/
│   └── functions.php        # WordPress用PHP関数
├── data/
│   └── games.json           # ゲームデータ
├── dist/                    # ビルド出力先
│   ├── famicon/              # 静的ファイル
│   │   ├── index.html
│   │   ├── main.[hash].js
│   │   ├── main.[hash].css
│   │   └── img/
│   └── wp-content/          # WordPressテーマ構造
│       └── themes/
│           └── saka.playground/
│               ├── functions.php
│               └── data/
│                   └── games.json
├── webpack.config.js        # Webpack設定
└── package.json             # 依存関係・スクリプト設定
```

## 機能詳細

### 🎮 ゲーム検索・表示

- リアルタイム検索機能
- ゲームカード形式での詳細表示
- 画像、レビュー、豆知識の表示

### 📋 50 音順一覧

- 右側オーバーレイでゲーム一覧表示
- 50 音順ソート機能
- クリックで該当ゲームまでスクロール

### ➕ データ追加機能

- モーダル形式での JSON データ入力
- WordPress REST API 対応
- データ検証・エラーハンドリング

## WordPress 連携

### REST API エンドポイント

```php
// ゲーム追加
POST /wp-json/famicom/v1/add-game

// ゲーム一覧取得
GET /wp-json/famicom/v1/games
```

### テーマ統合

```php
// functions.php に追加
add_action('rest_api_init', function () {
    register_rest_route('famicom/v1', '/add-game', array(
        'methods' => 'POST',
        'callback' => 'add_famicom_game'
    ));
});
```

## デプロイ

### 静的サイトデプロイ

1. プロダクションビルドを実行

   ```bash
   npm run build
   ```

2. `dist/famicon/` フォルダをホスティングサービスにアップロード
   - GitHub Pages
   - Netlify
   - Vercel
   - Firebase Hosting
   - AWS S3 + CloudFront

### WordPress 統合デプロイ

1. ビルド実行

   ```bash
   npm run build
   ```

2. `dist/wp-content/themes/saka.playground/` を WordPress テーマとして配置

3. テーマを有効化

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# 静的サイト起動
npm start

# ビルド結果クリーンアップ
npm run clean
```

## ライセンス

MIT License
