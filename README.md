# RockBand(仮) — Official Site

4人組ロックバンド「RockBand(仮)」のオフィシャルサイト。楽曲ごとのコンセプトLP(例: [bluebird](https://bluebird-lp.vercel.app/))とは別に、バンド全体の顔となるサイトです。右下のチャットボタンから、日替わりでメンバー本人とチャットできます。

**当番は日替わり**(日本時間0時に交代): カナト(Vo.)→ショウゴ(Gt.)→ガク(Ba.)→ユウイチ(Dr.)の4日周期。挨拶・ボタン文言・人格がその日の当番に切り替わります。

## 構成

- `index.html` — サイト本体(HERO / BAND / DISCOGRAPHY / footer。ウィジェット読み込みタグ追加済み)
- `band-widget.js` — チャットウィジェット(表示側の日替わりロジックもここ)
- `api/chat.js` — Vercelサーバーレス関数。**APIキーと4人分の人格設定はここ**(人格側の日替わりロジックもここ。ウィジェットと同じ計算式で当番を決定)

## APIキーの設定(初回のみ・必須)

1. https://console.anthropic.com でAPIキーを取得(従量課金。クレジット購入が必要)
2. 同コンソールの **Limits で月間利用上限(Spend Limit)を設定しておくことを強く推奨**
3. Vercelダッシュボード → プロジェクト → **Settings → Environment Variables** で
   - Key: `ANTHROPIC_API_KEY`
   - Value: 取得したキー(`sk-ant-...`)
4. **Deployments から Redeploy**(環境変数は再デプロイ後に反映されます)

これをしないとチャットは「接続に失敗しました」になります。サイト自体は今まで通り表示されます。

## カスタマイズ

- **メンバーの設定変更**: `api/chat.js` 冒頭の `BAND`(共通設定)と `MEMBERS`(個別の人格)を編集 → push。挨拶文は `band-widget.js` の `MEMBERS` に
- **日替わりをやめてカナト固定に戻す**: 両ファイルの `ROTATION` を `["kanato"]` にする
- **Discographyの追加・更新**: `index.html` の `#discography` セクション内、`.discog-item` を編集

## コスト・悪用対策

実装済み: 履歴は直近20メッセージまで / 1メッセージ1000文字まで / 応答は最大600トークン。

## 関連プロジェクト

- 楽曲ごとのコンセプトLP: [bluebird-lp](https://github.com/web-mix/bluebird-lp)(同じ`api/chat.js`の仕組みを先行実装。現在チャットの主軸はこちらのサイトに移行済み)
