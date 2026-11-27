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
  var sessionId = "";
  var sessionTitle = "";
  var runningSessions = [];
  function fillSessions(list) {
    runningSessions = list || [];
    while (eventSelect.firstChild) eventSelect.removeChild(eventSelect.firstChild);
    if (!runningSessions.length) {
      var fallback = document.createElement("option");
      fallback.value = "";
      fallback.textContent = CFG.eventName;
      eventSelect.appendChild(fallback);
      sessionId = "";
      sessionTitle = "";
      return;
    }
    runningSessions.forEach(function (ev) {
      var opt = document.createElement("option");
      opt.value = ev.id;
      opt.textContent = ev.title;
      eventSelect.appendChild(opt);
    });
    var current = window.MushenzhenSchedule.chooseCurrent(runningSessions);
    eventSelect.value = current.id;
    sessionId = current.id;
    sessionTitle = current.title;
    if (!$("date").dataset.touched) $("date").value = window.MushenzhenSchedule.shanghaiDate(current.start);
  }
  function sessionsFrom(data, nowMs) {
    if (data && (data.source === "sola" || data.source === "sample")) return data.events || [];
    return window.MushenzhenSchedule.runningAt(window.MushenzhenSchedule.normalizeList(data), nowMs);
  }
  function loadRunning() {
    var schedule = window.MushenzhenSchedule;
    if (!schedule || slug !== (CFG.defaultSlug || "mushenzhen-2026")) return;
    var nowMs = schedule.parseNowParam(params.get("now"), Date.now());
    var live = location.hostname === "mufriends.mushenzhen.xyz";
    var url = live ? "/events/now?now=" + encodeURIComponent(new Date(nowMs).toISOString()) : "../schedule-sample.json";
    fetch(url).then(function (res) {
      if (!res.ok) throw new Error("schedule");
      return res.json();
    }).then(function (data) {
      fillSessions(sessionsFrom(data, nowMs));
    }).catch(function () {
      if (!live) return;
      fetch("../schedule-sample.json").then(function (res) {
        if (!res.ok) throw new Error("sample");
        return res.json();
      }).then(function (data) {
        fillSessions(sessionsFrom(data, nowMs));
      }).catch(function () { fillSessions([]); });
    });
  }
  eventSelect.addEventListener("change", function () {
    var found = null;
    for (var i = 0; i < runningSessions.length; i++) {
      if (runningSessions[i].id === eventSelect.value) found = runningSessions[i];
    }
    if (found) {
      sessionId = found.id;
      sessionTitle = found.title;
      if (!$("date").dataset.touched) $("date").value = window.MushenzhenSchedule.shanghaiDate(found.start);
      return;
    }
    sessionId = "";
    sessionTitle = "";
    var next = eventBySlug(eventSelect.value) || events[0];
    if (!next) return;
    slug = next.slug;
    if (!$("date").dataset.touched) $("date").value = next.date;
    $("slug-line").textContent = "照片只进入这一场 / Photos stay on: " + slug;
  });
  loadRunning();
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
      setPhotoActionsVisible(true);
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

  function canSend() {
    return !busy && !!selected;
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
    var row = {
      nickname: optedContact(),
      message: $("caption").value.trim().slice(0, 140),
      photo_url: CFG.proxy + "/storage/v1/object/public/photos/" + path,
      event: slug,
      deleted: false
    };
    if (sessionId) {
      row.session_id = sessionId;
      row.session_title = sessionTitle;
    }
    return row;
  }
  function postPhoto(headers, row) {
    var url = CFG.proxy + "/rest/v1/photos";
    return fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(row)
    }).then(function (ins) {
      if (ins.ok || !row.session_id) return ins;
      var plain = {
        nickname: row.nickname,
        message: row.message,
        photo_url: row.photo_url,
        event: row.event,
        deleted: row.deleted
      };
      return fetch(url, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(plain)
      });
    });
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
    setPhotoActionsVisible(false);
    $("consent").checked = false;
    $("pick-label").textContent = "添加照片 / Add a photo";
  }
  function refreshGate() {
    $("send").disabled = !canSend();
    if (!selected) $("gate").textContent = "请先添加一张照片。 / Add a photo first.";
    else $("gate").textContent = "";
  }
  var modalReturn = null;
  function openConsentModal() {
    modalReturn = document.activeElement;
    $("consent-modal").hidden = false;
    $("consent-agree").focus();
    document.addEventListener("keydown", onModalKey);
  }
  function closeConsentModal() {
    $("consent-modal").hidden = true;
    document.removeEventListener("keydown", onModalKey);
    if (modalReturn && modalReturn.focus) modalReturn.focus();
  }
  function onModalKey(event) {
    if ($("consent-modal").hidden) return;
    if (event.key === "Escape") { event.preventDefault(); closeConsentModal(); return; }
    if (event.key !== "Tab") return;
    var nodes = [$("consent-agree"), $("consent-no"), $("consent-close")];
    var first = nodes[0];
    var last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  function setPhotoActionsVisible(isVisible) {
    $("photo-actions").hidden = !isVisible;
    $("save-hint").hidden = !isVisible;
  }
  function downloadPhoto(file, url) {
    var link = document.createElement("a");
    link.href = url;
    link.download = file.name || "mushenzhen-photo.jpg";
    link.click();
  }
  var POST_TAGS = "#mushenzhen #madeinshenzhen";
  function shareSelectedPhoto(isSaving) {
    if (!selected || !previewUrl) return;
    var file = selected;
    var canShareFiles = !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] }));
    if (!canShareFiles) {
      downloadPhoto(file, previewUrl);
      say(isSaving
        ? "长按照片存储到相册，或使用下载的图片。请选择“存储图像”。 / Touch and hold the photo to save, or use the download. Choose “Save Image”."
        : "已开始下载这张照片。 / The photo download has started.");
      return;
    }
    navigator.share({ files: [file] }).then(function () {
      say(isSaving
        ? "系统菜单已关闭，请确认已选择“存储图像”。 / Menu closed. Please check that you chose “Save Image”."
        : "分享菜单已关闭。 / Share menu closed.");
    }).catch(function (error) {
      if (error && error.name === "AbortError") return;
      downloadPhoto(file, previewUrl);
      say("无法打开系统菜单，已改为下载。 / The share menu failed, so the photo was downloaded.");
    });
  }
  function postShareText() {
    var caption = $("caption").value.trim();
    if (!caption) return POST_TAGS;
    return POST_TAGS + "\n" + caption;
  }
  function copyText(text) {
    if (!(navigator.clipboard && navigator.clipboard.writeText)) return Promise.reject(new Error("clipboard"));
    return navigator.clipboard.writeText(text);
  }
  function sharePost(copied) {
    var file = selected;
    var text = postShareText();
    var withText = { files: [file], text: text };
    var filesOnly = { files: [file] };
    var payload = null;
    if (navigator.share && navigator.canShare && navigator.canShare(withText)) payload = withText;
    else if (navigator.share && navigator.canShare && navigator.canShare(filesOnly)) payload = filesOnly;
    if (!payload) {
      downloadPhoto(file, previewUrl);
      say(copied
        ? "标签已复制，照片已开始下载。 / Tags copied. The photo download has started."
        : "已开始下载这张照片。请手动复制： " + POST_TAGS + " / The photo download has started. Copy this text yourself.");
      return;
    }
    navigator.share(payload).then(function () {
      say(copied
        ? "标签已复制，分享菜单已关闭。 / Tags copied. Share menu closed."
        : "分享菜单已关闭。请手动复制： " + POST_TAGS + " / Menu closed. Copy this text yourself.");
    }).catch(function (error) {
      if (error && error.name === "AbortError") return;
      downloadPhoto(file, previewUrl);
      say(copied
        ? "标签已复制。无法打开系统菜单，已改为下载。 / Tags copied. The share menu failed, so the photo was downloaded."
        : "无法打开系统菜单，已改为下载。请手动复制： " + POST_TAGS + " / The share menu failed, so the photo was downloaded. Copy this text yourself.");
    });
  }
  function handleSaveClick() { shareSelectedPhoto(true); }
  function handleShareClick() {
    if (!selected || !previewUrl) return;
    copyText(POST_TAGS).then(function () {
      sharePost(true);
    }).catch(function () {
      say("未能写入剪贴板，请手动复制： " + POST_TAGS + " / Could not copy. Copy this text yourself.");
      sharePost(false);
    });
  }

  $("photo").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file || busy) return;
    showPreview(file);
  });
  $("save").addEventListener("click", handleSaveClick);
  $("share").addEventListener("click", handleShareClick);
  $("consent").addEventListener("change", refreshGate);
  function beginUpload() {
    if (!$("consent").checked || !selected || busy) return;
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
        return postPhoto({
          apikey: headers.apikey,
          Authorization: headers.Authorization,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        }, photoRow(path));
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
  }
  $("send").addEventListener("click", function () {
    if (!canSend()) { refreshGate(); return; }
    if (!$("consent").checked) { openConsentModal(); return; }
    beginUpload();
  });
  $("consent-agree").addEventListener("click", function () {
    $("consent").checked = true;
    closeConsentModal();
    beginUpload();
  });
  $("consent-no").addEventListener("click", closeConsentModal);
  $("consent-close").addEventListener("click", closeConsentModal);
  $("consent-modal").addEventListener("click", function (event) {
    if (event.target === $("consent-modal")) closeConsentModal();
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
