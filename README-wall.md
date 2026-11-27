# 照片墙大屏（photowall-screen）

活动现场 / 线上活动的滚动照片墙大屏页。纯静态、无构建、无框架，和「遇」同一套技术路线。

- 🖥️ **本仓库就是大屏页**：多行照片无缝滚动，新照片先弹窗展示（昵称 + 留言）再汇入滚动流
- 📱 **上传页在本目录 `upload/`**，部署后是 `https://mufriends.mushenzhen.xyz/upload/`。只上传照片，不生成带个人二维码的话题卡
- 🎛️ 按 `M` 键进入管理模式，可删除乱传的照片

## 文件说明

```
index.html          大屏页（界面 + 样式）
config.js           ★ 所有配置都在这里：活动名、Logo、上传页二维码、配色、速度
app.js              滚动引擎 + 弹窗 + 数据轮询（一般不用改）
upload-snippet.js   ★ 给上传页用的接入代码（复制到你的上传页项目）
vendor/qrcode.min.js  二维码生成库
server.js           本地预览用（部署时不需要）
```

## 多活动模式（2026-11-25 起）

照片墙支持多场活动复用，**新活动零部署**：

- **这场活动**：打开 `https://mufriends.mushenzhen.xyz/?e=mushenzhen-2026`。
  不要用 `mufriends-2026-11-06`。右下角二维码会带上 `?e=`，指向同域名的 `/upload/`
- **另开一场**：打开 `?e=活动代号`，首次访问自动建档，照片按代号隔离
- **改活动名称 / 日期 / 标语**：在活动页按 `M` 进管理模式 → 左上角出现编辑表单 → 保存
- **活动索引**：打开根地址 `https://mufriends.mushenzhen.xyz/`（不带参数）会列出所有活动，点卡片进入对应活动
- **数据隔离**：每张照片带 `event` 字段，各活动互不可见；旧照片默认归 `mufriends-2026-11-06`

数据库迁移（升级到多活动前执行一次）：Supabase Dashboard → SQL Editor → 粘贴执行 `supabase-events-migration.sql`。

观众上传页是 `upload/`。说明写在照片的 `message`，自愿填写的联系文字写在 `nickname`。两个都空着时大屏不显示文字。

正在进行的场次来自 sola 的公开接口 `GET https://api.sola.day/api/v1/events?group_id=3mywjlvveoge2&limit=100`（无需登录，没有公开的 iCal）。Worker 的 `GET /events/now` 会拉这份列表，缓存约 8 分钟，再按 UTC 滤出 `start <= now < end`。正式站要 Sunny 跑 `npx wrangler deploy` 才生效。GitHub Pages 和本地预览不打这个接口，改用仓库里的 `schedule-sample.json`，并用 `?now=2026-12-02T14:30:00%2B08:00` 这种时间看某一刻。照片仍归 `mushenzhen-2026`。场次标题要入库的话，Sunny 可选执行 `sql/mushenzhen-session-optional.sql`；没执行也不影响上传。

上场前执行仓库里的 `sql/mushenzhen-2026-rls.sql`（不要在这个 PR 里直接改线上库）。

## 三分钟配置

打开 `config.js`，填三处：

1. **活动信息**：`eventName` 活动名称、`slogan` 标语胶囊（可留空）、`logoUrl` 换 Logo（留空用内置 mu 深圳 Logo）
2. **上传页二维码**：`uploadUrl` 已是 `https://mufriends.mushenzhen.xyz/upload/`
3. **Supabase**（不填则为 demo 模式，方便先看效果）：
   - 项目建好后，在 Dashboard → **Project Settings → API** 复制 **Project URL** 和 **anon public key**
   - 填进 `supabase` 两个字段
   - **同一个项目的凭证，大屏页和上传页都要用**——这是两边串联的关键

改完刷新页面即生效。

## Supabase 建库（一次性）

Dashboard → **SQL Editor** → 新建查询 → 把 `supabase-setup.sql` 整段粘贴进去执行。
它会建好：照片表 `photos`、公开存储桶 `photos`、以及最初的匿名策略。

muShenzhen 2026 上场前再执行仓库根目录的 `sql/mushenzhen-2026-rls.sql`，收紧成「只能插入，M 只能隐藏」。

## 上传页

观众页面是 `upload/`。本地：`node server.js`，然后打开 `http://127.0.0.1:7100/upload/?e=mushenzhen-2026`。

`upload-snippet.js` 不是这场的上传页，不要用它传二维码。

## 部署到 GitHub Pages

本仓库已开启 Pages，推送 `main` 分支后约 1 分钟自动生效：
**https://xiaoyug.github.io/mufriends-wall/**

```
git add -A && git commit -m "更新" && git push
```

## 现场使用

- 大屏：电脑浏览器打开大屏页地址 → 按 `F11` 全屏 → 投屏
- 删照片：按 `M` 进入管理模式 → 点照片右上角 ✕（会同步云端标记，刷新后也不再出现）→ 再按 `M` 退出
- 左下角小圆点是状态灯：绿色 = 已连上云端，红色 = 连接异常（会自动重试，已加载的照片继续滚动）

## 本地预览

```
npm run dev          # 默认 http://localhost:7100/
```

或直接 `python3 -m http.server 7100` 也行（纯静态）。

## 免费额度参考（Supabase Free）

- 数据库 500 MB（一条照片记录仅几百字节）
- 文件存储 1 GB（压缩后每张照片约 300KB，可存 3000 张以上）
- 月流量 5 GB，一场活动足够

## 活动后导出照片

```bash
python3 export-photos.py                              # 导出全部照片到 ./export/（含已删除的）
python3 export-photos.py --live                       # 只导出大屏上还在展示的
python3 export-photos.py --event mufriends-2026-11-06 # 只导出某场活动
```

照片按上传顺序编号下载，同目录生成 `index.csv`（昵称 / 留言 / 上传时间 / 活动 / 文件名），
用 Excel 或 Numbers 打开即可对照。无需安装依赖。

## 线上地址

- **正式（Cloudflare / 国内可访问）**：https://mufriends.mushenzhen.xyz/
- 备用（GitHub Pages）：https://xiaoyug.github.io/mufriends-wall/

## 重新部署到 Cloudflare

改动文件后，在本目录执行：

```bash
npx wrangler deploy
```

静态文件会上传到 Workers 静态资源，`wrangler.toml` 里已绑定
`mufriends.mushenzhen.xyz`。`.assetsignore` 控制哪些文件不上传
（本机工具、文档、导出的照片等）。
