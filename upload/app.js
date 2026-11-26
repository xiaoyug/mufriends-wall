/* 上传页行为。样式在 index.html。
 * 只上传客人选中的那张照片（压成 JPEG），不合成话题卡，不上传二维码。
 * 只 INSERT 照片。隐藏照片是大屏按 M 的事，这里不发 PATCH / DELETE。
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var CFG = window.UPLOAD_CONFIG;
  var selected = null;
  var previewUrl = "";
  var busy = false;

  function cleanSlug(raw) {
    if (!raw || raw.length > 80) return "";
    if (!/^[\w\u4e00-\u9fff-]+$/.test(raw)) return "";
    return raw;
  }

  var events = (CFG.events && CFG.events.length) ? CFG.events : [
    { slug: CFG.defaultSlug, name: CFG.eventName, date: CFG.eventDate }
  ];
  function eventBySlug(value) {
    for (var i = 0; i < events.length; i++) if (events[i].slug === value) return events[i];
    return null;
  }
  var eventSelect = $("event");
  events.forEach(function (ev) {
    var opt = document.createElement("option");
    opt.value = ev.slug;
    opt.textContent = ev.name;
    eventSelect.appendChild(opt);
  });

  var params = new URLSearchParams(location.search);
  var requested = cleanSlug(params.get("e") || "");
  if (requested === "mufriends-2026-11-06") requested = "";
  var chosen = eventBySlug(requested) || eventBySlug(CFG.defaultSlug) || events[0];
  var slug = chosen.slug;
  eventSelect.value = chosen.slug;
  $("date").value = chosen.date;
  $("date").addEventListener("input", function () { $("date").dataset.touched = "1"; });
  eventSelect.addEventListener("change", function () {
    var next = eventBySlug(eventSelect.value) || events[0];
    slug = next.slug;
    if (!$("date").dataset.touched) $("date").value = next.date;
    $("slug-line").textContent = "照片只进入这一场 / Photos stay on: " + slug;
  });
  $("slug-line").textContent = "照片只进入这一场 / Photos stay on: " + slug;
  if (params.get("e") === "mufriends-2026-11-06") {
    say("这是 11 月 6 日的旧活动，照片会进入 muShenzhen 2026。 / That link is the 6 Nov event. Photos go to muShenzhen 2026.");
  } else if (requested && !eventBySlug(requested)) {
    say("活动链接无效，已改用 muShenzhen 2026。 / That event link was not valid. Using muShenzhen 2026.");
  }

  function say(text) {
    $("status").textContent = text;
  }

  function showPreview(file) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = url;
      selected = file;
      $("preview").src = url;
      $("preview").className = "show";
      $("caption-wrap").hidden = false;
      $("pick-label").textContent = "更换照片 / Change photo";
      say("");
      refreshGate();
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      say("这张照片读不了，请换一张 JPG 或 PNG。 / Could not read that photo. Try a JPG or PNG.");
    };
    img.src = url;
  }

  function isContactOpen() {
    return $("contact-toggle").getAttribute("aria-expanded") === "true";
  }
  function setContactOpen(isOpen) {
    $("contact-toggle").setAttribute("aria-expanded", isOpen ? "true" : "false");
    $("contact-panel").hidden = !isOpen;
    if (!isOpen) $("contact").value = "";
  }
  function optedContact() {
    if (!isContactOpen()) return "";
    return $("contact").value.trim().slice(0, 80);
  }
  function handleContactToggle() {
    setContactOpen(!isContactOpen());
  }

  $("contact-toggle").addEventListener("click", handleContactToggle);

  function canSubmit() {
    return !busy && !!(selected && $("consent").checked);
  }
  function allowsUpload() {
    return location.hostname === "mufriends.mushenzhen.xyz";
  }
  function authHeaders() {
    return { apikey: CFG.anonKey, Authorization: "Bearer " + CFG.anonKey };
  }
  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        URL.revokeObjectURL(url);
        if (!w || !h) { reject(new Error("decode")); return; }
        var scale = Math.min(1, 1600 / Math.max(w, h));
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        var g = canvas.getContext("2d");
        g.fillStyle = "#ffffff";
        g.fillRect(0, 0, canvas.width, canvas.height);
        g.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(function (blob) {
          if (!blob) reject(new Error("compress"));
          else resolve(blob);
        }, "image/jpeg", 0.82);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject(new Error("decode"));
      };
      img.src = url;
    });
  }
  function photoRow(path) {
    return {
      nickname: optedContact(),
      message: $("caption").value.trim().slice(0, 140),
      photo_url: CFG.proxy + "/storage/v1/object/public/photos/" + path,
      event: slug,
      deleted: false
    };
  }
  function clearPhoto() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = "";
    selected = null;
    $("preview").removeAttribute("src");
    $("preview").className = "";
    $("caption").value = "";
    $("caption-wrap").hidden = true;
    setContactOpen(false);
    $("consent").checked = true;
    $("pick-label").textContent = "添加照片 / Add a photo";
  }
  function refreshGate() {
    var ready = canSubmit();
    $("send").disabled = !ready;
    if (!selected) $("gate").textContent = "请先添加一张照片。 / Add a photo first.";
    else if (!$("consent").checked) $("gate").textContent = "请先勾选同意后再上传。 / Tick consent before uploading.";
    else $("gate").textContent = "";
  }

  $("photo").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file || busy) return;
    showPreview(file);
  });
  $("consent").addEventListener("change", refreshGate);
  $("send").addEventListener("click", function () {
    if (!canSubmit()) { refreshGate(); return; }
    if (!allowsUpload()) {
      say("这是预览，照片没有传到正式墙。 / Preview only. The photo was not sent to the live wall.");
      return;
    }
    var file = selected;
    busy = true;
    refreshGate();
    say("正在上传… / Uploading…");
    compressImage(file).then(function (blob) {
      var path = Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
      var headers = authHeaders();
      return fetch(CFG.proxy + "/storage/v1/object/photos/" + path, {
        method: "POST",
        headers: { apikey: headers.apikey, Authorization: headers.Authorization, "Content-Type": "image/jpeg" },
        body: blob
      }).then(function (up) {
        if (!up.ok) throw new Error("照片上传被拒 HTTP " + up.status);
        return fetch(CFG.proxy + "/rest/v1/photos", {
          method: "POST",
          headers: {
            apikey: headers.apikey,
            Authorization: headers.Authorization,
            "Content-Type": "application/json",
            Prefer: "return=minimal"
          },
          body: JSON.stringify(photoRow(path))
        });
      }).then(function (ins) {
        if (!ins.ok) throw new Error("写入被拒 HTTP " + ins.status);
        return fetch(CFG.proxy + "/rest/v1/events", {
          method: "POST",
          headers: {
            apikey: headers.apikey,
            Authorization: headers.Authorization,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates,return=minimal"
          },
          body: JSON.stringify({
            slug: slug,
            name: (eventBySlug(slug) || events[0]).name,
            date: $("date").value || (eventBySlug(slug) || events[0]).date
          })
        }).catch(function () {});
      });
    }).then(function () {
      clearPhoto();
      say("已上墙，去大屏幕找这张照片。 / On the wall. Look for it on the big screen.");
    }).catch(function (err) {
      say("上传失败：" + ((err && err.message) || "请重试") + " / Upload failed. Try again.");
    }).then(function () {
      busy = false;
      refreshGate();
    });
  });
  var host = location.hostname;
  if (host !== "mufriends.mushenzhen.xyz" && host !== "localhost" && host !== "127.0.0.1") {
    $("preview-banner").hidden = false;
  }
  refreshGate();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(function () {
      var offline = $("offline");
      if (offline) offline.textContent = "页面已缓存，上传仍需网络 / Page cached. Uploading still needs a network.";
    }).catch(function () {});
  }
})();
