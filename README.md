# GameMap Vibe Annotator

ゲームマップに手書き・テキストアノテーションを重畳管理するツール。
バイブコーディングのみで作成！！！


## 技術スタック (Tech Stack)

このプロジェクトは以下の技術で構築されています：

- **Frontend**: [React](https://react.dev/) 18
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)


## セットアップ

```bash
# モジュールをローカルにインストール
npm install
# 開発環境のwebを起動
npm run dev
```

ブラウザで http://localhost:5173 を開く。

## ビルド

```bash
# ビルド　ー＞　./distに完成ファイルが出力
npm run build
# 本番環境のwebを起動
npm run preview
```

## 機能

- **ゲーム/マップ管理**: ヘッダーのタブでゲームを切り替え、サイドバーでマップを選択
- **画像読み込み**: ローカルファイルを選択してマップ背景として表示（画像なしはグリッド表示）
- **手書きレイヤー**: ペンツールでフリーハンド描画、消しゴムで部分消去
- **テキストレイヤー**: Tツール選択後キャンバスをクリック → テキスト入力 → Enterで配置、×ボタンで削除
- **保存**: LocalStorageに保存（手書きはBase64 PNG、テキストは相対座標%）

## データ構造

```json
{
  "active_game": "game_01",
  "active_map": "map_001",
  "games": {
    "game_01": {
      "title": "RPG Adventure",
      "maps": [
        {
          "id": "map_001",
          "name": "始まりの洞窟",
          "image_data": "data:image/...",
          "canvas_data": "data:image/png;base64,...",
          "annotations": [
            { "x": 0.45, "y": 0.22, "text": "ボス：ドラゴン", "color": "#f97316" }
          ]
        }
      ]
    }
  }
}
```
