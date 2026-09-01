## Summary

<!-- 何のための変更か（1〜3行）。なぜ今やるかを書く。 -->

## Test plan

- [ ] ローカル: 該当する検証（例: `pnpm test:api` / `pnpm typecheck:web` / skill `post-change-verify`）
- [ ] CI 緑を確認
- [ ] （UI）PR コメント「UI スクリーンショット（自動）」または Artifacts **ui-screenshots** を目視

## Checklist

- [ ] `.env` 実値・secret・トークンを含めていない
- [ ] 振る舞い変更ならテストあり（または「テスト不要」の理由を Summary に書いた）
- [ ] 画面/API ルート変更なら `generate_product_docs` / skill `product-spec-sync` を検討した
- [ ] 大きな見た目変更なら Lab → 採用の要否を検討した（`design-lab` / `design-adoption`）
- [ ] Auth・公開面・env なら `secure-change-checklist` / `deploy-change` を検討した

## Notes

<!-- レビュア向けの補足。任意。 -->
