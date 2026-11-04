/* ============================================================
 * 上传页接入代码 —— 贴进你的上传页（「遇」改造版）即可
 *
 * 作用：用户上传照片时，把 照片 + 昵称 + 留言 写到 LeanCloud，
 *       大屏页每 5 秒轮询一次，新照片自动弹窗 + 汇入滚动。
 *
 * 两步接入：
 * 1. 在 index.html 的 </body> 前引入 LeanCloud SDK：
 *      <script src="https://cdn.jsdelivr.net/npm/leancloud-storage@4.15.1/dist/av-min.js"></script>
 *      <script src="upload-snippet.js"></script>
 * 2. 填好下面三件套（和大屏页 config.js 里必须一致），
 *    然后在用户确认上传时调用：
 *      uploadToWall({ nickname: "Sunny", message: "玩得开心！", file: file对象或Blob })
 * ============================================================
 */

// ---- 和大屏页 config.js 里的 leancloud 保持一致 ----
var LC_CONFIG = {
  appId: "",
  appKey: "",
  serverURL: ""        // 例: "https://xxxx.lc-cn-n1-shared.com"
};

AV.init(LC_CONFIG);

/**
 * 上传一张照片到照片墙
 * @param {Object}  opts
 * @param {string}  opts.nickname  昵称（可空字符串）
 * @param {string}  opts.message   留言（可空字符串）
 * @param {File|Blob} opts.file    照片文件（input[type=file] 或拍照得到的 File）
 * @returns {Promise} 成功 resolve，失败 reject
 */
function uploadToWall(opts) {
  return compressImage(opts.file, 1600, 0.8).then(function (blob) {
    var name = (opts.nickname || "guest") + "-" + Date.now() + ".jpg";
    var file = new AV.File(name, blob);
    return file.save().then(function (savedFile) {
      var row = new AV.Object("PhotoWall");
      row.set("nickname", String(opts.nickname || "").slice(0, 30));
      row.set("message", String(opts.message || "").slice(0, 140));
      row.set("photo", savedFile);
      row.set("deleted", false);
      return row.save();
    });
  });
}

/**
 * 压缩图片：长边压到 maxSize 以内，转 JPEG。
 * 现场网络不稳时这步很关键 —— 5MB 原图会压到 ~300KB。
 */
function compressImage(file, maxSize, quality) {
  return new Promise(function (resolve, reject) {
    var img = new Image();
    img.onload = function () {
      var w = img.width, h = img.height;
      var scale = Math.min(1, maxSize / Math.max(w, h));
      var c = document.createElement("canvas");
      c.width = Math.round(w * scale);
      c.height = Math.round(h * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      c.toBlob(function (blob) {
        blob ? resolve(blob) : reject(new Error("压缩失败"));
      }, "image/jpeg", quality || 0.8);
    };
    img.onerror = function () { reject(new Error("图片读取失败")); };
    img.src = URL.createObjectURL(file);
  });
}

/* ---------- 调用示例 ----------
document.getElementById("send-btn").addEventListener("click", function () {
  var file = document.getElementById("photo-input").files[0];
  uploadToWall({
    nickname: document.getElementById("nick-input").value,
    message:  document.getElementById("msg-input").value,
    file: file
  }).then(function () {
    // 提示「已上墙」
  }).catch(function (err) {
    console.error(err);
    // 提示「上传失败，请重试」
  });
});
-------------------------------- */
