# 照片墙大屏（photowall-screen）

活动现场 / 线上活动的滚动照片墙大屏页。纯静态、无构建、无框架，和「遇」同一套技术路线。

- 🖥️ **本仓库就是大屏页**：多行照片无缝滚动，新照片先弹窗展示（昵称 + 留言）再汇入滚动流
- 📱 **上传页另做**（基于「遇」改造）：两个页面通过 Supabase 免费云端串联，不需要自己的服务器
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

## 三分钟配置

打开 `config.js`，填三处：

1. **活动信息**：`eventName` 活动名称、`slogan` 标语胶囊（可留空）、`logoUrl` 换 Logo（留空用内置 mu 深圳 Logo）
2. **上传页二维码**：`uploadUrl` 填上传页的线上地址，大屏右下角会自动生成二维码
3. **Supabase**（不填则为 demo 模式，方便先看效果）：
   - 项目建好后，在 Dashboard → **Project Settings → API** 复制 **Project URL** 和 **anon public key**
   - 填进 `supabase` 两个字段
   - **同一个项目的凭证，大屏页和上传页都要用**——这是两边串联的关键

改完刷新页面即生效。

## Supabase 建库（一次性）

Dashboard → **SQL Editor** → 新建查询 → 把 `supabase-setup.sql` 整段粘贴进去执行。
它会建好：照片表 `photos`、公开存储桶 `photos`、以及匿名读写权限策略。

## 上传页怎么接

把 `upload-snippet.js` 复制到你的上传页项目，按文件头注释两步接入：

1. 页面引入 Supabase SDK + 这个文件
2. 填同样的 URL 和 anon key，用户确认上传时调用 `uploadToWall({ nickname, message, file })`

照片会先压缩（长边 1600px、JPEG 80%，约 300KB）再上传，弱网也稳。大屏每 5 秒轮询一次新照片。

数据约定（两边共用，不要改字段名）：表 `photos`，字段 `nickname` / `message` / `photo_url` / `deleted`（删除标记）。

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
