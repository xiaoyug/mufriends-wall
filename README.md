# 照片墙大屏（photowall-screen）

活动现场 / 线上活动的滚动照片墙大屏页。纯静态、无构建、无框架，和「遇」同一套技术路线。

- 🖥️ **本仓库就是大屏页**：多行照片无缝滚动，新照片先弹窗展示（昵称 + 留言）再汇入滚动流
- 📱 **上传页另做**（基于「遇」改造）：两个页面通过 LeanCloud 免费云端串联，不需要自己的服务器
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

1. **活动信息**：`eventName` 活动名称、`logoUrl` Logo 图片（可留空）
2. **上传页二维码**：`uploadUrl` 填上传页的线上地址，大屏右下角会自动生成二维码
3. **LeanCloud**（不填则为 demo 模式，方便先看效果）：
   - 去 [console.leancloud.cn](https://console.leancloud.cn) 注册，创建应用（选**开发版**，免费）
   - 应用的「设置 → 应用凭证」里复制 App ID、App Key、服务器地址（REST API 服务器地址）
   - 填进 `leancloud` 三件套
   - **同一个应用的凭证，大屏页和上传页都要用**——这是两边串联的关键

改完刷新页面即生效。

## 上传页怎么接

把 `upload-snippet.js` 复制到你的上传页项目，按文件头注释两步接入：

1. 页面引入 LeanCloud SDK + 这个文件
2. 填同样的三件套，用户确认上传时调用 `uploadToWall({ nickname, message, file })`

照片会先压缩（长边 1600px、JPEG 80%，约 300KB）再上传，弱网也稳。大屏每 5 秒轮询一次新照片。

数据约定（两边共用，不要改字段名）：表 `PhotoWall`，字段 `nickname` / `message` / `photo`（文件）/ `deleted`（删除标记）。

## 部署到 Cloudflare Pages（免费、国内可访问）

1. 把这个目录推到 GitHub 仓库（`server.js`、`package.json` 可留可删，不影响）
2. 登录 [dash.cloudflare.com](https://dash.cloudflare.com)（免费注册）→ **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. 选中仓库，构建设置全部留空（Framework preset 选 None，Build command 留空，输出目录填 `/`）
4. 部署完成后得到 `https://你的项目.pages.dev` 地址，国内直接可访问
5. 以后 `git push` 就自动更新

## 现场使用

- 大屏：电脑浏览器打开大屏页地址 → 按 `F11` 全屏 → 投屏
- 删照片：按 `M` 进入管理模式 → 点照片右上角 ✕（会同步云端标记，刷新后也不再出现）→ 再按 `M` 退出
- 左上角小圆点是状态灯：绿色 = 已连上云端，红色 = 连接异常（会自动重试，已加载的照片继续滚动）

## 本地预览

```
npm run dev          # 默认 http://localhost:7100/
```

或直接 `python3 -m http.server 7100` 也行（纯静态）。

## 免费额度参考（LeanCloud 开发版）

- API 请求 3 万次/天（大屏 5 秒轮询一次，4 小时活动约 3000 次，远够用）
- 文件存储 10 GB（压缩后每张照片约 300KB，可存 3 万张以上）
- 数据存储 1 GB
