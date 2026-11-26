// ============================================================
// MuFriends 照片墙大屏 · 配置
// 改这里就行，不用动其他文件。改完刷新页面生效。
// ============================================================

window.WALL_CONFIG = {

  // ---- 活动信息 ----
  // 本场用 ?e=mushenzhen-2026。不要把照片放进 mufriends-2026-11-06。
  eventName: "muShenzhen 2026",
  eventSlug: "mushenzhen-2026",
  eventDate: "2026-11-29",
  eventLine: "29 Nov – 18 Dec 2026 · OCT-LOFT C2",
  slogan: "",                         // 不另写宣传语；空着时本场显示上面的日期和场地
  logoUrl: "",                        // 留空 = 使用内置的 mu 深圳 Logo

  // ---- 上传页二维码（和墙同一域名）----
  uploadUrl: "https://mufriends.mushenzhen.xyz/upload/",

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
  // message 是照片说明，nickname 是客人自愿写下的联系文字。都空着就不显示。
  showNickname: true,
  showMessage: true,

  // ---- 外观（mu 深圳海报语言：白底 + 黑描边 + 硬投影）----
  palette: ["#e23e3e", "#f7d708", "#2fa96b", "#e583b8", "#2e9bd6", "#7b5ea7", "#e8833a"],
  gap: 26,                            // 照片间距

  // ---- demo 模式 ----
  demoCount: 15,                      // demo 模式下生成多少张假照片
};
