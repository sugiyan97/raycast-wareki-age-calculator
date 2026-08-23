# raycast-wareki-age-calculator

和暦⇔西暦の変換と年齢計算を行う Raycast 拡張機能です。**Raycastストアには公開していません。** 身内向けの非公開配布のみです。

## 動作要件

- macOS + [Raycast](https://www.raycast.com/) がインストール済みであること
- [Node.js](https://nodejs.org/)（v20以上推奨）と npm

## インストール手順

### 方法A: 非公開GitHubリポジトリから取得する場合

自分のGitHubアカウントがこのリポジトリにコラボレーターとして招待されている場合。

```bash
git clone https://github.com/sugiyan97/raycast-wareki-age-calculator.git
cd raycast-wareki-age-calculator
npm install
npm run build
```

### 方法B: Zipで受け取った場合

1. 受け取ったZipファイルを任意の場所に展開する
2. ターミナルで展開したフォルダに移動し、以下を実行する

```bash
cd <展開したフォルダ>
npm install
npm run build
```

### Raycastへの読み込み

`npm run build` が警告なく完了したら、Raycastに読み込みます。

1. Raycastを起動する
2. Raycastの検索窓で `Import Extension`（`Add Local Extension`）と入力して実行する
3. 展開・cloneしたプロジェクトのフォルダ（`package.json` がある場所）を選択する
4. 読み込み完了後、Raycastの検索窓で `Wareki Calculator` と入力するとコマンドが使えるようになる

## アンインストール

Raycastの `Manage Extensions` 画面から `Wareki Calculator` を選び、削除する。

## トラブルシューティング

- `npm run build` でエラーが出る場合は Node.js のバージョンを確認してください（v20以上）
- Raycastの検索に出てこない場合は、`Manage Extensions` から拡張機能が読み込まれているか確認してください
