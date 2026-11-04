/* MuFriends 照片墙大屏 · 主逻辑
 * 视觉语言：mu 深圳海报 —— 白底、黑描边、硬投影、拍立得贴纸卡片、等宽字体胶囊
 * 数据源：Supabase（config 填了 supabase.url / anonKey 时）或内置 demo 模式
 */
(function () {
  var CFG = window.WALL_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var PALETTE = CFG.palette || ["#e23e3e", "#f7d708", "#2fa96b", "#e583b8", "#2e9bd6", "#7b5ea7", "#e8833a"];

  // ---------- 顶栏：活动名（逐字微旋转，海报感）+ 标语胶囊 + Logo ----------
  var name = CFG.eventName || "MuFriends";
  var nameEl = $("event-name");
  var tilts = [-2.5, 1.8, -1.2, 2.2, -1.8, 1.4, -2, 2.6, -1.5, 1.9];
  name.split("").forEach(function (ch, i) {
    var s = document.createElement("span");
    s.className = "ch";
    s.textContent = ch;
    s.style.transform = "rotate(" + tilts[i % tilts.length] + "deg) translateY(" + ((i % 2) ? -3 : 2) + "px)";
    nameEl.appendChild(s);
  });

  if (CFG.slogan) {
    var pill = $("slogan-pill");
    pill.textContent = CFG.slogan;
    pill.style.display = "inline-block";
  }

  var logoSrc = CFG.logoUrl || window.WALL_LOGO_BLACK || "";
  if (logoSrc) {
    var logo = $("logo");
    logo.src = logoSrc;
    logo.style.display = "block";
    logo.onerror = function () { logo.style.display = "none"; };
  }

  // ---------- 装饰：漂浮的彩色星号（呼应海报的 ASCII 符号）----------
  ["✳", "✱", "✳", "✱"].forEach(function (ch, i) {
    var s = document.createElement("div");
    s.className = "spark";
    s.textContent = ch;
    s.style.color = PALETTE[i * 2 % PALETTE.length];
    s.style.fontSize = (28 + i * 10) + "px";
    s.style.left = [46, 88, 8, 70][i] + "vw";
    s.style.top = [12, 78, 55, 30][i] + "vh";
    s.style.transform = "rotate(" + (i * 37) + "deg)";
    document.body.appendChild(s);
  });

  // ---------- 右下角上传二维码 ----------
  if (CFG.uploadUrl && window.QRCode) {
    $("qr-box").style.display = "block";
    new QRCode($("qr"), {
      text: CFG.uploadUrl,
      width: 108, height: 108,
      colorDark: "#111111", colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // ---------- 滚动引擎 ----------
  var wall = $("wall");
  var rowCount = Math.max(2, Math.min(4, CFG.rows || 3));
  var gap = CFG.gap == null ? 26 : CFG.gap;
  var photoH = CFG.photoHeight > 0
    ? CFG.photoHeight
    : Math.floor((window.innerHeight - 220) / rowCount) - gap;
  var photoW = Math.round(photoH * 4 / 3);
  var cellTiltSeed = 0;

  function Row(dir) {
    this.el = document.createElement("div");
    this.el.className = "row";
    this.el.style.height = (photoH + 26) + "px";  // 26 = 白边 + 投影余量
    this.el.style.paddingLeft = "12px";           // 给左倾卡片留位
    this.dir = dir;
    this.offset = 0;
    wall.appendChild(this.el);
  }
  Row.prototype.addCell = function (item) {
    var cell = document.createElement("div");
    cell.className = "cell";
    cell.style.width = photoW + "px";
    cell.style.height = photoH + "px";
    cell.style.marginRight = gap + "px";
    cell.style.setProperty("--tilt", (((cellTiltSeed++ * 37) % 5) - 2) * 0.9 + "deg");
    cell.dataset.pid = item.id;

    var img = document.createElement("img");
    img.src = item.url;
    img.alt = item.nickname || "";
    cell.appendChild(img);

    var del = document.createElement("div");
    del.className = "del";
    del.textContent = "✕";
    del.title = "删除这张照片";
    del.addEventListener("click", function (e) {
      e.stopPropagation();
      removePhoto(item.id);
    });
    cell.appendChild(del);

    this.el.appendChild(cell);
    return cell;
  };
  Row.prototype.tick = function (dt) {
    var speed = (CFG.speed || 42) * dt;
    var first = this.el.firstElementChild;
    if (!first) return;
    var w = first.getBoundingClientRect().width + gap;
    if (this.dir === -1) {
      this.offset -= speed;
      if (this.offset <= -w) { this.el.appendChild(first); this.offset += w; }
    } else {
      this.offset += speed;
      if (this.offset >= 0) { this.el.insertBefore(this.el.lastElementChild, first); this.offset -= w; }
    }
    this.el.style.transform = "translateX(" + this.offset + "px)";
  };

  var rows = [];
  for (var i = 0; i < rowCount; i++) rows.push(new Row(i % 2 === 0 ? -1 : 1));
  rows.forEach(function (r) { if (r.dir === 1) r.offset = -photoW - gap; });

  var lastT = performance.now();
  (function loop(now) {
    var dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    for (var i = 0; i < rows.length; i++) rows[i].tick(dt);
    requestAnimationFrame(loop);
  })(lastT);

  // ---------- 照片集合管理 ----------
  var seen = {};
  var counts = rows.map(function () { return 0; });

  function addToWall(item) {
    if (seen[item.id]) return;
    seen[item.id] = true;
    var idx = 0;
    for (var i = 1; i < rows.length; i++) if (counts[i] < counts[idx]) idx = i;
    rows[idx].addCell(item);
    counts[idx]++;
    $("empty").style.display = "none";
  }

  function removePhoto(pid) {
    var cells = wall.querySelectorAll('[data-pid="' + pid + '"]');
    for (var i = 0; i < cells.length; i++) {
      var cell = cells[i];
      var rowEl = cell.parentNode;
      var rowIdx = rows.findIndex(function (r) { return r.el === rowEl; });
      cell.parentNode.removeChild(cell);
      if (rowIdx >= 0) counts[rowIdx]--;
    }
    if (sb) {
      sb.from("photos").update({ deleted: true }).eq("id", pid)
        .then(function (res) { if (res.error) console.warn("云端删除失败", res.error); });
    }
  }

  // ---------- 新照片弹窗（排队播放）----------
  var popupQueue = [];
  var popping = false;

  function enqueuePopup(item) {
    popupQueue.push(item);
    if (!popping) nextPopup();
  }
  function nextPopup() {
    var item = popupQueue.shift();
    if (!item) { popping = false; return; }
    popping = true;
    $("popup-img").src = item.url;
    $("popup-nick").textContent = (CFG.showNickname !== false && item.nickname) ? item.nickname : "";
    $("popup-msg").textContent = (CFG.showMessage !== false && item.message) ? item.message : "";
    $("popup").classList.add("show");
    setTimeout(function () {
      $("popup").classList.remove("show");
      addToWall(item);
      setTimeout(nextPopup, 350);
    }, CFG.popupMs || 4200);
  }

  // ---------- 管理模式：按 M 切换 ----------
  document.addEventListener("keydown", function (e) {
    if (e.key === "m" || e.key === "M") document.body.classList.toggle("managing");
  });

  // ---------- 数据源：Supabase ----------
  var sb = null;              // supabase client
  var statusEl = $("status");

  function startSupabase(cfg) {
    var script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js";
    script.onload = function () {
      sb = window.supabase.createClient(cfg.url, cfg.anonKey);
      statusEl.className = "ok";
      initialFetch();
      setInterval(pollNew, 5000);
    };
    script.onerror = function () {
      statusEl.className = "err";
      console.warn("Supabase SDK 加载失败，进入 demo 模式");
      startDemo();
    };
    document.head.appendChild(script);
  }

  var lastTime = null;   // 已取到的最新 created_at

  function toItem(row) {
    return {
      id: row.id,
      url: row.photo_url || "",
      nickname: row.nickname || "",
      message: row.message || "",
      createdAt: row.created_at
    };
  }

  function initialFetch() {
    sb.from("photos")
      .select("*")
      .eq("deleted", false)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(function (res) {
        if (res.error) { statusEl.className = "err"; console.warn("初次拉取失败", res.error); return; }
        var items = (res.data || []).map(toItem).filter(function (it) { return it.url; }).reverse();
        if (items.length === 0) $("empty").style.display = "flex";
        items.forEach(addToWall);
        if (res.data && res.data.length > 0) lastTime = res.data[0].created_at;
      });
  }

  function pollNew() {
    if (!lastTime) return;
    sb.from("photos")
      .select("*")
      .eq("deleted", false)
      .gt("created_at", lastTime)
      .order("created_at", { ascending: true })
      .limit(20)
      .then(function (res) {
        if (res.error) { statusEl.className = "err"; console.warn("轮询失败（会自动重试）", res.error); return; }
        statusEl.className = "ok";
        var fresh = (res.data || []).map(toItem).filter(function (it) { return it.url && !seen[it.id]; });
        fresh.forEach(enqueuePopup);   // 新照片：先弹窗，后入墙
        if (res.data && res.data.length > 0) lastTime = res.data[res.data.length - 1].created_at;
      });
  }

  // ---------- demo 模式：mu 海报配色 + 涂鸦小人剪影 ----------
  var FIGURES = [
    // 简笔小人：行走、挥手、坐下、骑车、跳跃（路径为 100x100 坐标系）
    function (x, c) { x.beginPath(); x.arc(50, 18, 10, 0, 7); x.fill(); x.fillRect(42, 28, 16, 34); x.fillRect(36, 60, 12, 32); x.fillRect(54, 60, 12, 32); x.fillRect(28, 30, 12, 8); x.fillRect(60, 30, 12, 8); },           // 站立
    function (x) { x.beginPath(); x.arc(50, 16, 10, 0, 7); x.fill(); x.save(); x.translate(50, 30); x.rotate(-0.2); x.fillRect(-8, 0, 16, 32); x.restore(); x.fillRect(30, 58, 11, 34); x.fillRect(56, 58, 11, 30); x.fillRect(60, 8, 9, 26); },  // 挥手
    function (x) { x.beginPath(); x.arc(58, 22, 10, 0, 7); x.fill(); x.save(); x.translate(44, 40); x.rotate(0.5); x.fillRect(-8, -6, 16, 30); x.restore(); x.fillRect(52, 50, 30, 10); x.fillRect(74, 56, 10, 28); },                            // 坐下
    function (x) { x.beginPath(); x.arc(52, 14, 9, 0, 7); x.fill(); x.save(); x.translate(48, 26); x.rotate(0.35); x.fillRect(-7, 0, 14, 28); x.restore(); x.beginPath(); x.arc(28, 78, 14, 0, 7); x.lineWidth = 6; x.strokeStyle = x.fillStyle; x.stroke(); x.beginPath(); x.arc(74, 78, 14, 0, 7); x.stroke(); x.fillRect(40, 52, 24, 8); } // 骑车
  ];

  function makeDemoPhoto(i) {
    var w = 480, h = 360;
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    var ctx = c.getContext("2d");
    var col = PALETTE[i % PALETTE.length];
    // 白底 + 顶部色条
    ctx.fillStyle = "#fbfaf5";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = col;
    ctx.fillRect(0, 0, w, 14);
    // 大号涂鸦小人
    ctx.fillStyle = col;
    ctx.save();
    ctx.translate(w / 2 - 90, h / 2 - 105);
    ctx.scale(1.8, 1.8);
    FIGURES[i % FIGURES.length](ctx);
    ctx.restore();
    // 等宽字体标注
    ctx.fillStyle = "#111";
    ctx.font = "700 26px Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText("\\1// moment " + String(i + 1).padStart(2, "0"), w / 2, h - 34);
    // 角落星号
    ctx.font = "900 34px sans-serif";
    ctx.fillStyle = PALETTE[(i + 3) % PALETTE.length];
    ctx.fillText("✳", w - 42, 56);
    return c.toDataURL("image/jpeg", 0.88);
  }

  function startDemo() {
    var n = CFG.demoCount || 15;
    for (var i = 0; i < n; i++) {
      addToWall({ id: "demo-" + i, url: makeDemoPhoto(i), nickname: "", message: "" });
    }
    var k = n;
    setInterval(function () {
      enqueuePopup({
        id: "demo-live-" + k,
        url: makeDemoPhoto(k),
        nickname: "mu 朋友 " + (k - n + 1),
        message: "demo 模式 · 模拟新上传"
      });
      k++;
    }, 12000);
  }

  // ---------- 启动 ----------
  var sbCfg = CFG.supabase || {};
  if (sbCfg.url && sbCfg.anonKey) {
    startSupabase(sbCfg);
  } else {
    console.info("[照片墙] 未配置 Supabase，进入 demo 模式");
    startDemo();
  }
})();
