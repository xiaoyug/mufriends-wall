/* MuFriends 照片墙大屏 · 主逻辑
 * 视觉语言：mu 深圳海报 —— 白底、黑描边、硬投影、拍立得贴纸卡片、等宽字体胶囊
 * 数据源：Supabase（config 填了 supabase.url / anonKey 时）或内置 demo 模式
 */
(function () {
  var CFG = window.WALL_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };
  var PALETTE = CFG.palette || ["#e23e3e", "#f7d708", "#2fa96b", "#e583b8", "#2e9bd6", "#7b5ea7", "#e8833a"];

  // ---------- 多活动：URL 带 ?e=slug 进入对应活动；不带则显示活动索引 ----------
  var EVENT_SLUG = (function () {
    var m = /[?&]e=([^&]+)/.exec(location.search);
    return m ? decodeURIComponent(m[1]) : "";
  })();
  if (EVENT_SLUG) $("event-editor").dataset.active = "1";   // 活动编辑表单只在活动页的管理模式出现

  // ---------- 顶栏：活动名 + 日期场地 + 官方 logo ----------
  // Black block under the logo. A live schedule can pass a name later.
  // Empty, or a name that is only the slug, falls back to the config event.
  function currentEventName(name) {
    var text = name ? String(name).trim() : "";
    if (!text) return CFG.eventName || "muShenzhen 2026";
    return text;
  }
  var scheduleApplied = false;
  function setEventTitle(text) {
    var block = $("date-block");
    var raw = text || "";
    var cut = raw.indexOf(" / ");
    var shown = cut === -1 ? raw : raw.slice(0, cut) + "\n" + raw.slice(cut + 3);
    if (Array.from(shown).length > 180) shown = Array.from(shown).slice(0, 180).join("") + "…";
    block.textContent = shown;
    block.title = raw;
  }
  function renderCurrentEventName(name) {
    if (scheduleApplied) return;
    setEventTitle(currentEventName(name));
  }
  function showScheduleTitle(title) {
    scheduleApplied = true;
    setEventTitle(title || currentEventName(""));
  }
  function loadScheduleName() {
    var schedule = window.MushenzhenSchedule;
    if (!schedule) return;
    var nowValue = "";
    var match = /[?&]now=([^&]+)/.exec(location.search);
    if (match) nowValue = decodeURIComponent(match[1]);
    var nowMs = schedule.parseNowParam(nowValue, Date.now());
    var live = location.hostname === "mufriends.mushenzhen.xyz";
    var url = live ? "/events/now?now=" + encodeURIComponent(new Date(nowMs).toISOString()) : "schedule-sample.json";
    fetch(url).then(function (res) {
      if (!res.ok) throw new Error("schedule");
      return res.json();
    }).then(function (data) {
      var running = (data && (data.source === "sola" || data.source === "sample"))
        ? (data.events || [])
        : schedule.runningAt(schedule.normalizeList(data), nowMs);
      var current = schedule.chooseCurrent(running);
      showScheduleTitle(current ? current.title : "");
    }).catch(function () {});
  }
  function renderSlogan(text) {
    var pill = $("slogan-pill");
    if (!pill) return;
    if (text) { pill.textContent = text; pill.style.display = "inline-block"; }
    else { pill.style.display = "none"; }
  }
  var knownSlug = CFG.eventSlug || "mushenzhen-2026";
  if (!EVENT_SLUG || EVENT_SLUG === knownSlug) {
    renderCurrentEventName(CFG.eventName || "照片墙");
    renderSlogan(CFG.slogan || CFG.eventLine || "");
  } else {
    renderCurrentEventName("");
    renderSlogan("");
  }

  var logoSrc = CFG.logoUrl || window.WALL_LOGO_BLACK || "";
  if (logoSrc) {
    var logo = $("logo");
    logo.src = logoSrc;
    logo.style.display = "block";
    logo.onerror = function () { logo.style.display = "none"; };
  }

  // One small accent mark. Not a second logo, and not a grey star.
  var spark = document.createElement("div");
  spark.className = "spark";
  spark.textContent = "✳";
  spark.style.color = "#DFFF2F";
  spark.style.fontSize = "16px";
  spark.style.left = "58%";
  spark.style.top = "14%";
  document.body.appendChild(spark);

  // ---------- 右下角上传二维码（带活动参数，来宾扫码直达对应活动的上传页）----------
  if (CFG.uploadUrl && window.QRCode) {
    var qrText = CFG.uploadUrl;
    if (EVENT_SLUG) qrText += (qrText.indexOf("?") >= 0 ? "&" : "?") + "e=" + encodeURIComponent(EVENT_SLUG);
    $("qr-box").style.display = "block";
    new QRCode($("qr"), {
      text: qrText,
      width: 108, height: 108,
      colorDark: "#111111", colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // ---------- 滚动引擎 ----------
  var wall = $("wall");
  var rowCount = Math.max(2, Math.min(4, CFG.rows || 3));
  var gap = CFG.gap == null ? 26 : CFG.gap;
  var wallBox = wall.getBoundingClientRect();
  var wallPad = parseFloat(getComputedStyle(wall).paddingTop) + parseFloat(getComputedStyle(wall).paddingBottom);
  var openH = Math.floor((wallBox.height - wallPad) / rowCount) - gap - 8;
  var photoH = CFG.photoHeight > 0 ? CFG.photoHeight : Math.max(160, openH);
  var photoW = Math.round(photoH * 4 / 3);
  var cellTiltSeed = 0;
  var innerH = photoH - 18; // 卡片内边距 8 + 10

  // 按图片真实比例修正显示宽度（竖版「遇」卡片完整展示，不被裁切）
  function clipCaption(text) {
    var chars = Array.from(String(text || "").trim());
    if (!chars.length) return "";
    if (chars.length <= 25) return chars.join("");
    return chars.slice(0, 25).join("") + "…";
  }
  function fitImg(img) {
    if (img.naturalWidth && img.naturalHeight) {
      var ratio = img.naturalWidth / img.naturalHeight;
      ratio = Math.max(0.45, Math.min(7 / 5, ratio));
      var h = parseFloat(img.style.height) || innerH;
      var w = Math.round(h * ratio);
      img.style.width = w + "px";
      img.style.objectFit = "contain";
    }
  }

  function Row(dir) {
    this.el = document.createElement("div");
    this.el.className = "row";
    this.el.style.height = (photoH + 28) + "px";  // 倾斜和硬投影留位
    this.el.style.paddingLeft = "12px";           // 给左倾卡片留位
    this.dir = dir;
    this.offset = 0;
    this.origins = [];
    wall.appendChild(this.el);
  }
  Row.prototype.addCell = function (item) {
    var self = this;
    var cell = document.createElement("div");
    cell.className = "cell";
    cell.style.height = photoH + "px";
    cell.style.marginRight = gap + "px";
    cell.style.setProperty("--tilt", (((cellTiltSeed++ * 37) % 5) - 2) * 0.9 + "deg");
    cell.dataset.pid = item.id;
    cell.dataset.origin = "1";

    // 宽度跟随图片真实比例：竖版「遇」卡片完整展示，不被裁切
    var caption = clipCaption(item.message);
    var imgH = caption ? Math.max(40, innerH - 26) : innerH;
    var img = document.createElement("img");
    img.src = item.url;
    img.alt = caption;
    img.style.height = imgH + "px";
    img.style.width = Math.round(imgH * 4 / 3) + "px";
    fitImg(img);
    img.addEventListener("load", function () {
      fitImg(img);
      var copies = self.el.querySelectorAll('[data-clone="1"][data-pid="' + item.id + '"] img');
      for (var i = 0; i < copies.length; i++) {
        copies[i].style.width = img.style.width;
        copies[i].style.height = img.style.height;
      }
      self.ensureFilled();
    });
    // 加载失败重试 3 次，仍失败则从墙上移除，避免留破图框
    var fails = 0;
    img.addEventListener("error", function () {
      fails++;
      if (fails <= 3) {
        setTimeout(function () { img.src = item.url; }, 1500 * fails);
      } else if (cell.parentNode) {
        var rowEl = cell.parentNode;
        rowEl.removeChild(cell);
        var idx = rows.findIndex(function (r) { return r.el === rowEl; });
        if (idx >= 0) counts[idx]--;
        self.ensureFilled();
      }
    });
    cell.appendChild(img);
    if (caption) {
      var cap = document.createElement("div");
      cap.className = "cap";
      cap.textContent = caption;
      cell.appendChild(cap);
    }

    var del = document.createElement("div");
    del.className = "del";
    del.textContent = "✕";
    del.title = "删除这张照片 · Delete";
    cell.appendChild(del);

    this.el.appendChild(cell);
    this.origins.push(cell);
    this.ensureFilled();
    return cell;
  };

  // 该行内容总宽（含间距）
  Row.prototype.rowWidth = function () {
    var w = 0;
    for (var c = this.el.firstElementChild; c; c = c.nextElementSibling) w += c.offsetWidth + gap;
    return w;
  };

  // 把这一行的照片重复到至少两倍视口宽，循环时没有空白段。
  Row.prototype.ensureFilled = function () {
    var spacers = this.el.querySelectorAll(".spacer");
    for (var s = 0; s < spacers.length; s++) spacers[s].parentNode.removeChild(spacers[s]);
    if (!this.origins.length) return;
    var need = Math.max(wall.clientWidth, window.innerWidth) * 2;
    var guard = 0;
    var n = this.origins.length;
    while (this.rowWidth() < need && guard < n * 40) {
      var src = this.origins[guard % n];
      var copy = src.cloneNode(true);
      copy.dataset.clone = "1";
      copy.removeAttribute("data-origin");
      this.el.appendChild(copy);
      guard++;
      if (!src.offsetWidth) break;
    }
  };

  Row.prototype.tick = function (dt) {
    var speed = (CFG.speed || 42) * dt;
    var first = this.el.firstElementChild;
    if (!first) return;
    if (this.dir === -1) {
      this.offset -= speed;
      var w = first.offsetWidth + gap;
      if (this.offset <= -w) { this.el.appendChild(first); this.offset += w; }
    } else {
      this.offset += speed;
      if (this.offset >= 0) {
        var last = this.el.lastElementChild;
        var wl = last.offsetWidth + gap;
        this.el.insertBefore(last, first);
        this.offset -= wl;
      }
    }
    this.el.style.transform = "translateX(" + this.offset + "px)";
  };

  var rows = [];
  for (var i = 0; i < rowCount; i++) rows.push(new Row(i % 2 === 0 ? -1 : 1));
  rows.forEach(function (r) { if (r.dir === 1) r.offset = -photoW - gap; });

  var lastT = performance.now();
  document.addEventListener("visibilitychange", function () { lastT = performance.now(); });
  window.addEventListener("resize", function () {
    lastT = performance.now();
    rows.forEach(function (r) { r.ensureFilled(); });
  });
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
      if (rowIdx >= 0 && cell.dataset.origin === "1") {
        counts[rowIdx]--;
        rows[rowIdx].origins = rows[rowIdx].origins.filter(function (origin) { return origin.dataset.pid !== pid; });
      }
    }
    rows.forEach(function (r) { r.ensureFilled(); });
    if (sb) {
      sb.from("photos").update({ deleted: true }).eq("id", pid)
        .then(function (res) { if (res.error) console.warn("云端删除失败", res.error); });
    }
  }

  // 删除按钮用事件代理，统一在 #wall 上处理点击
  wall.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t !== wall && !(t.classList && t.classList.contains("del"))) t = t.parentNode;
    if (!t || t === wall) return;
    e.stopPropagation();
    var cell = t.parentNode;
    if (cell && cell.dataset && cell.dataset.pid) removePhoto(cell.dataset.pid);
  });

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
      if (EVENT_SLUG) {
        // 活动模式：读活动信息（不存在则自动建档），然后只拉这个活动的照片
        loadEvent(EVENT_SLUG, function () {
          initialFetch();
          setInterval(pollNew, 5000);
        });
      } else {
        // 索引模式：列出所有活动
        showIndex();
      }
    };
    script.onerror = function () {
      statusEl.className = "err";
      console.warn("Supabase SDK 加载失败，进入 demo 模式");
      startDemo();
    };
    document.head.appendChild(script);
  }

  // ---------- 活动信息：读 events 表，slug 先行自动建档 ----------
  var currentEvent = null;

  function loadEvent(slug, next) {
    sb.from("events").select("*").eq("slug", slug).limit(1)
      .then(function (res) {
        var ev = res.data && res.data[0];
        if (ev) { applyEvent(ev); next(); return; }
        var now = new Date();
        var today = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
        var known = slug === (CFG.eventSlug || "mushenzhen-2026");
        var row = {
          slug: slug,
          name: known ? (CFG.eventName || slug) : slug,
          date: known ? (CFG.eventDate || today) : today,
          slogan: ""
        };
        var host = location.hostname;
        if (host === "localhost" || host === "127.0.0.1") {
          applyEvent(row);
          next();
          return;
        }
        sb.from("events").insert(row).then(function (ins) {
          if (ins.error) console.warn("活动自动建档失败（不影响展示）", ins.error);
          applyEvent(row);
          next();
        });
      });
  }

  function applyEvent(ev) {
    currentEvent = ev;
    var known = ev.slug === (CFG.eventSlug || "mushenzhen-2026");
    var name = ev.name || "";
    if (!name || name === ev.slug) name = "";
    renderCurrentEventName(name);
    var line = ev.slogan || "";
    if (!line && known) line = CFG.eventLine || "";
    renderSlogan(line || ev.date || "");
    // 管理模式的活动编辑表单回填
    if ($("ee-name")) {
      $("ee-name").value = ev.name || "";
      $("ee-date").value = ev.date || "";
      $("ee-slogan").value = ev.slogan || "";
    }
  }

  // 管理模式：保存活动信息
  if ($("ee-save")) {
    $("ee-save").addEventListener("click", function () {
      if (!sb || !EVENT_SLUG) return;
      var row = {
        name: $("ee-name").value.trim(),
        date: $("ee-date").value,
        slogan: $("ee-slogan").value.trim()
      };
      sb.from("events").update(row).eq("slug", EVENT_SLUG).then(function (res) {
        var btn = $("ee-save");
        if (res.error) { btn.textContent = "保存失败，重试 · Failed"; console.warn(res.error); return; }
        applyEvent(Object.assign({ slug: EVENT_SLUG }, row));
        btn.textContent = "已保存 ✓ · Saved";
        setTimeout(function () { btn.textContent = "保存 · Save"; }, 2000);
      });
    });
  }

  // ---------- 活动索引页（不带 ?e= 时）----------
  function showIndex() {
    var idx = $("index");
    idx.style.display = "flex";
    sb.from("events").select("*").order("date", { ascending: false })
      .then(function (res) {
        var list = $("index-list");
        var events = res.data || [];
        if (res.error) { list.innerHTML = '<div class="idx-empty">读取失败，检查云端状态 · Failed to load</div>'; return; }
        if (!events.length) { list.innerHTML = '<div class="idx-empty">还没有活动 · No events yet</div>'; return; }
        events.forEach(function (ev) {
          var a = document.createElement("a");
          a.className = "idx-card";
          a.href = "?e=" + encodeURIComponent(ev.slug);
          a.innerHTML = '<div class="idx-name"></div><div class="idx-meta mono"></div>';
          a.querySelector(".idx-name").textContent = ev.name || ev.slug;
          a.querySelector(".idx-meta").textContent = (ev.date || "————") + " · " + ev.slug;
          list.appendChild(a);
        });
      });
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
      .eq("event", EVENT_SLUG)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(function (res) {
        if (res.error) { statusEl.className = "err"; console.warn("初次拉取失败", res.error); return; }
        var items = (res.data || []).map(toItem).filter(function (it) { return it.url; }).reverse();
        if (items.length === 0) $("empty").style.display = "flex";
        items.forEach(addToWall);
        if (res.data && res.data.length > 0) lastTime = res.data[0].created_at;
        else if (!lastTime) lastTime = new Date().toISOString();
      });
  }

  function pollNew() {
    if (!lastTime) return;
    sb.from("photos")
      .select("*")
      .eq("deleted", false)
      .eq("event", EVENT_SLUG)
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

  // ---------- 只读演示：?demo=1 用本地海报，不连云端 ----------
  function isReadOnlyDemo() {
    return /[?&]demo=1(?:&|$)/.test(location.search);
  }
  function showFixedPopup(item) {
    $("popup-img").src = item.url;
    $("popup-nick").textContent = (CFG.showNickname !== false && item.nickname) ? item.nickname : "";
    $("popup-msg").textContent = (CFG.showMessage !== false && item.message) ? item.message : "";
    $("popup").classList.add("show", "review");
    $("popup-close").focus();
  }
  function startFixedDemo() {
    document.body.classList.add("demo");
    var posters = [
      { url: "assets/demo/focus.jpg", message: "记录正在创造的项目，把现场的过程留给后来的人再看一眼", nickname: "" },
      { url: "assets/demo/diary.jpg", message: "", nickname: "@joedoe (Instagram)" },
      { url: "assets/demo/rewards.jpg", message: "来领取特别奖励", nickname: "@joedoe (Instagram)" },
      { url: "assets/demo/diary.jpg", message: "", nickname: "" }
    ];
    var byId = {};
    var n = 0;
    for (var round = 0; round < 3; round++) {
      for (var s = 0; s < posters.length; s++) {
        var shot = posters[s];
        var item = {
          id: "demo-" + n,
          url: shot.url,
          message: shot.message,
          nickname: shot.nickname
        };
        byId[item.id] = item;
        addToWall(item);
        n++;
      }
    }
    wall.addEventListener("click", function (e) {
      var t = e.target;
      if (t.classList && t.classList.contains("del")) return;
      while (t && t !== wall && !(t.classList && t.classList.contains("cell"))) t = t.parentNode;
      if (!t || t === wall) return;
      var item = byId[t.dataset.pid];
      if (item) showFixedPopup(item);
    });
    function closeReviewPopup() {
      $("popup").classList.remove("show", "review");
    }
    $("popup").addEventListener("click", function (e) {
      if (e.target !== $("popup")) return;
      closeReviewPopup();
    });
    $("popup-close").addEventListener("click", function (e) {
      e.stopPropagation();
      closeReviewPopup();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      if (!$("popup").classList.contains("review")) return;
      closeReviewPopup();
    });
  }

  // ---------- 启动 ----------
  // 调试钩子：控制台可手动加照片验证布局
  window.__wall = { add: addToWall, popup: enqueuePopup, remove: removePhoto };

  var sbCfg = CFG.supabase || {};
  loadScheduleName();
  if (isReadOnlyDemo()) {
    startFixedDemo();
  } else if (sbCfg.url && sbCfg.anonKey) {
    startSupabase(sbCfg);
  } else {
    console.info("[照片墙] 未配置 Supabase，进入 demo 模式");
    startDemo();
  }
})();
