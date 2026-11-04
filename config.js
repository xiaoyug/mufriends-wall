// ============================================================
// MuFriends 照片墙大屏 · 配置
// 改这里就行，不用动其他文件。改完刷新页面生效。
// ============================================================

window.WALL_CONFIG = {

  // ---- 活动信息 ----
  eventName: "MuFriends",             // 顶部大标题
  slogan: "下一种生活，由你想象",      // 黑色胶囊标语，留空 "" 则不显示
  logoUrl: "",                        // 留空 = 使用内置的 mu 深圳 Logo
                                      // 也可填图片路径/URL 换成别的 Logo

  // ---- 上传页二维码 ----
  uploadUrl: "",                      // 上传页线上地址，填了右下角生成二维码
                                      // 例: "https://your-name.github.io/yu/"

  // ---- LeanCloud 数据中转（串联上传页的关键）----
  // 1. 去 https://console.leancloud.cn 注册，创建一个应用（开发版，免费）
  // 2. 在 设置 → 应用凭证 里拿到 App ID / App Key / 服务器地址
  // 3. 填到下面。不填则进入 demo 模式（用假照片展示效果）
  leancloud: {
    appId: "",
    appKey: "",
    serverURL: ""                     // 例: "https://xxxx.lc-cn-n1-shared.com"
  },

  // ---- 滚动 ----
  rows: 3,                            // 滚动行数（2~4 比较合适）
  speed: 42,                          // 滚动速度，像素/秒
  photoHeight: 0,                     // 照片高度（像素），0 = 自动按行数均分屏幕

  // ---- 新照片弹窗 ----
  popupMs: 4200,                      // 新照片在大屏中央停留的毫秒数
  showNickname: true,
  showMessage: true,

  // ---- 外观（mu 深圳海报语言：白底 + 黑描边 + 硬投影）----
  palette: ["#e23e3e", "#f7d708", "#2fa96b", "#e583b8", "#2e9bd6", "#7b5ea7", "#e8833a"],
  gap: 26,                            // 照片间距

  // ---- demo 模式 ----
  demoCount: 15,                      // demo 模式下生成多少张假照片
};
