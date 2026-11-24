// ============================================================
// MuFriends 照片墙大屏 · 配置
// 改这里就行，不用动其他文件。改完刷新页面生效。
// ============================================================

window.WALL_CONFIG = {

  // ---- 活动信息 ----
  eventName: "MuFriends",             // 顶部大标题
  slogan: "下一种生活，由你想象 · Life, as you imagine",   // 黑色胶囊标语，留空 "" 则不显示
  logoUrl: "",                        // 留空 = 使用内置的 mu 深圳 Logo
                                      // 也可填图片路径/URL 换成别的 Logo

  // ---- 上传页二维码 ----
  uploadUrl: "https://xiaoyug.github.io/yu/",   // 「遇」线上地址，右下角自动生成二维码

  // ---- Supabase 数据中转（已配好，勿动）----
  // 通过 mufriends.mushenzhen.xyz 的 /proxy/ 反代访问，避免国内直连 supabase.co 不稳定
  supabase: {
    url: "https://mufriends.mushenzhen.xyz/proxy",
    anonKey: "sb_publishable_TeAH2DCcPXl2e-MVtwyPOQ_kIEQ79YB"
  },

  // ---- 滚动 ----
  rows: 2,                            // 滚动行数（2 行卡片最大最清晰；3~4 行更密但更小）
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
