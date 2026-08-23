# Contributing

## コミットメッセージ規約

コミットメッセージは以下の形式にしてください。

```
<type>: 日本語での説明
```

`type` は以下のいずれかを使用します。

| type       | 用途                               |
| ---------- | ---------------------------------- |
| `feat`     | 新機能の追加                       |
| `fix`      | バグ修正                           |
| `docs`     | ドキュメントのみの変更             |
| `chore`    | ビルド設定・依存関係更新などの雑務 |
| `refactor` | 挙動を変えないコードの整理         |
| `test`     | テストの追加・修正                 |
| `ci`       | CI/CD 設定の変更                   |

例:

```
feat: 和暦入力の元号切り替わり年の境界値処理を追加
fix: 閏日生まれの年齢計算がずれる不具合を修正
docs: READMEに配布手順を追加
ci: lintとtestを自動実行するワークフローを追加
```

Dependabot が自動作成するコミット（`build(deps): ...`）はこの規約の対象外です。

## ブランチ命名規則

ブランチ名は以下の形式にしてください。

```
<type>/issue-<N>-<kebab-case-description>
```

`type` はコミットメッセージ規約と同じものを使用します。`N` は対応するIssue番号です。

例:

```
feat/issue-16-git-conventions
fix/issue-20-leap-day-age-bug
docs/issue-21-update-readme
```

Dependabot が自動作成するブランチ（`dependabot/...`）はこの規則の対象外です。

この規則はCIでは強制していません（ドキュメント上の取り決めです）。
