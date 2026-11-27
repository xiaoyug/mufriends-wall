# 部署说明 · Sunny

给要合并和部署的人。预览站不会写正式库。

## 改了什么 · What changed

相对 `xiaoyug/encountering` 的 `main`，行为变化主要在 `wall/`。`yu/` 不再做话题卡，只留一个指向正式上传页的链接，自己不上传。`sql/` 里的脚本要你在 Dashboard 里执行，合并本身不会改库。

主要文件：

- `wall/upload/` 照片上传页（同意弹窗、压缩、分享）
- `wall/app.js` `wall/index.html` 大屏滚动、弹窗、5 秒轮询
- `wall/worker.js` 原有 `/proxy/*` 不动；新增只读 `GET /events/now`；`/upload` 指向静态页
- `wall/schedule.mjs` 解析 sola 的活动列表，并决定要不要翻下一页
- `wall/schedule-sample.json` 2026-11-27 拉下来的公开日程快照，给 Pages 和本地预览用
- `wall/wrangler.toml` 没有改：还是 `mufriends-wall`，静态目录 `.`，域名 `mufriends.mushenzhen.xyz`
- `sql/mushenzhen-2026-rls.sql` 要执行
- `sql/mushenzhen-session-optional.sql` 可不执行
- `yu/` 旧上传页改成跳转说明

没有新的密钥。客户端仍是原来的公开 anon key。

## sola 日程 · Live calendar

来源是公开 JSON，不是网页 HTML，也没有 iCal：

`GET https://api.sola.day/api/v1/events?group_id=3mywjlvveoge2&limit=100&page=N`

不传 `collection`，所以上游页面里的 upcoming 和 past 都会进来，再按 `start <= now < end` 过滤。网站上的 `page=2` 只是每页 20 条的翻页；同一批活动在 `limit=100` 时往往在第一页就到齐。2026-11-27 实测：全量 51 条，`limit=100` 的 `total_pages` 是 1；`collection=upcoming&limit=20` 有 3 页。第 2 页上的活动（例如 ClawCon）已经在这 51 条里，标题和起止时间对得上。

Worker 仍会按 `meta.next_page` 翻页，最多 10 页，避免以后超过 100 条时丢掉后面的场。整份列表缓存 8 分钟（`max-age=480`）。任何一页失败都返回空列表（HTTP 502），墙上名字退回 `muShenzhen 2026`，上传不中断。

时间在 API 里是 UTC。下面是按 `Asia/Shanghai` 换算后的结果，和 sola 页面一致。

第 1 页（upcoming, limit 20）里的 5 场：

| 标题 Title | 开始–结束 Start–end (上海) |
|---|---|
| 开幕仪式 / Opening Ceremony | 2026-11-29 14:00–16:30 |
| Tech on, life on | 2026-11-30 14:00–17:00 |
| The Art of the Pasture · Hong Lok Club Farm Day Trip / 牧野之艺 · 康乐会农场一日游 | 2026-12-01 08:00–21:00 |
| 【额外付费 / Extra Fee】瓦楞纸板快速原型 \| Cardboard Prototyping | 2026-12-01 10:00–12:00 |
| PaXini · From Touch to Data: Workshop & Pitches / 帕西尼 · 从触觉到数据：工作坊与路演 | 2026-12-01 14:00–17:00 |

第 2 页里的 5 场：

| 标题 Title | 开始–结束 Start–end (上海) |
|---|---|
| ClawCon 大会 / ClawCon Conference | 2026-12-06 12:30–17:00 |
| 未来人实验室｜个人生物基线检测 / Future Human Lab \| Personal Biomarker Baseline | 2026-12-07 08:30–11:00 |
| 清晨养生功法 / Morning Body Practice | 2026-12-07 09:00–10:00 |
| 长寿与再生医学开幕日 / Longevity & Regenerative Medicine · 上午场 / Morning Session | 2026-12-07 10:00–12:00 |
| 未来人实验室｜量化自我工作坊 / Future Human Lab \| Quantified Self Workshop | 2026-12-07 14:00–16:30 |

这批标题里有中文、英文和长标题。2026-11-27 的公开列表里没有 emoji。预览可以用 `?now=2026-12-06T14:00:00%2B08:00`，黑块应显示 `ClawCon 大会 / ClawCon Conference`（第 2 页上的那场，当时只有它在进行）。

## 合并 · Review and merge

1. 看 `helinaio/encountering` 分支 `cursor/mushenzhen-2026-photo-wall-8277` 相对 `xiaoyug/encountering` `main` 的 diff。
2. 确认没有人要求把代码 push 到 `xiaoyug/yu` 或 `xiaoyug/mufriends-wall`。
3. 合并进 `xiaoyug/encountering` 的 `main`。GitHub Pages 如果跟的是这个仓库的预览分支，以你们自己的 Pages 设置为准；正式站不靠 Pages。

## 数据库 · SQL

在 Supabase SQL Editor 里执行 `sql/mushenzhen-2026-rls.sql`。这一份要跑。

`sql/mushenzhen-session-optional.sql` 只是给照片加 `session_id` / `session_title`。不跑也可以：上传遇到未知列会去掉这两项再试一次，照片仍然进 `mushenzhen-2026`。

## 部署 · Deploy

```bash
cd wall && npx wrangler deploy
```

只 push git 不会更新 `mufriends.mushenzhen.xyz`。`wrangler.toml` 的域名和 `/proxy` 上游没有改。

## 上线后检查 · Verify

- `https://mufriends.mushenzhen.xyz/upload/?e=mushenzhen-2026` 能打开，预览横幅不出现。
- `https://mufriends.mushenzhen.xyz/events/now` 返回 JSON，`source` 为 `sola`。失败时应是 502 且 `events: []`。
- `https://mufriends.mushenzhen.xyz/?e=mushenzhen-2026` 大屏大约每 5 秒拉一次新照片。空墙也会记住时间，第一张新照片下一轮能出现。
- 手机上传一张，不同意则没有新照片；同意后大约 10 秒内上墙。
- 大屏按 `M`，点 `✕`，照片从墙上消失。

## 回滚 · Rollback

1. 在 `xiaoyug/encountering` 的 `main` 上 `git revert` 这次合并提交并 push。
2. 再执行一次 `cd wall && npx wrangler deploy`，让线上 Worker 回到旧脚本。
3. 已经执行的 SQL 不会随 git revert 自动撤销。RLS 若要改回去，需要单独写 SQL。可选的 session 列留着也无害。

## 现场网络 · Venue test

用会场 Wi‑Fi 打开正式上传页，用微信内置浏览器和一台系统浏览器各传一张。微信若打不开 sola 或 supabase，先看是不是 Wi‑Fi 拦了外网。大屏电脑用有线或稳定 Wi‑Fi，浏览器全屏。

## 已知限制 · Limits

- 同意文案还没有律师定稿。
- 不要先印二维码。墙上二维码指向 `https://mufriends.mushenzhen.xyz/upload/`，部署成功后再印。
- `M` 没有密码。
- 手机若解不开 HEIC，页面会提示换 JPG 或 PNG。上传前会把图压成 JPEG，长边最多 1600。
- 分享菜单里 App 的顺序由系统决定。
- 免费 Supabase 大约闲置 7 天会暂停。暂停后再在 Dashboard 里 Resume。
- Pages 预览读的是 `schedule-sample.json`，不是线上 `/events/now`。
