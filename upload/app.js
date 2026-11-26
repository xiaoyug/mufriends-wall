/* 上传页行为。样式在 index.html。
 * 选照片、预览、可选说明、活动名称和日期。还不上墙。
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var CFG = window.UPLOAD_CONFIG;
  var selected = null;
  var previewUrl = "";

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function today() {
    var now = new Date();
    return now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate());
  }
  function cleanSlug(raw) {
    if (!raw || raw.length > 80) return "";
    if (!/^[\w\u4e00-\u9fff-]+$/.test(raw)) return "";
    return raw;
  }

  var params = new URLSearchParams(location.search);
  var requested = cleanSlug(params.get("e") || "");
  var slug = requested || CFG.defaultSlug;
  var branded = slug === CFG.defaultSlug;
  var defaultName = branded ? CFG.eventName : slug;
  var defaultDate = branded ? CFG.eventDate : today();

  function prefill(name, date) {
    if (!$("event").dataset.touched) $("event").value = name || "";
    if (!$("date").dataset.touched) $("date").value = date || "";
  }
  $("event").addEventListener("input", function () { $("event").dataset.touched = "1"; });
  $("date").addEventListener("input", function () { $("date").dataset.touched = "1"; });
  prefill(defaultName, defaultDate);
  $("slug-line").textContent = "照片只进入这一场 / Photos stay on: " + slug;
  if (!requested && params.get("e")) {
    say("活动链接无效，已改用 muShenzhen 2026。 / That event link was not valid. Using muShenzhen 2026.");
  }

  fetch(CFG.proxy + "/rest/v1/events?slug=eq." + encodeURIComponent(slug) + "&select=name,date", {
    headers: {
      apikey: CFG.anonKey,
      Authorization: "Bearer " + CFG.anonKey,
      Accept: "application/json"
    }
  }).then(function (res) {
    return res.ok ? res.json() : [];
  }).then(function (rows) {
    var ev = rows && rows[0];
    if (!ev) return;
    prefill(ev.name, ev.date);
  }).catch(function () {});

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

  function optedContact() {
    if (!$("contact-on").checked) return "";
    return $("contact").value.trim().slice(0, 80);
  }

  $("contact-on").addEventListener("change", function () {
    $("contact-wrap").hidden = !$("contact-on").checked;
    if (!$("contact-on").checked) $("contact").value = "";
  });

  function canSubmit() {
    return !!(selected && $("consent").checked);
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
    if (!file) return;
    showPreview(file);
  });
  $("consent").addEventListener("change", refreshGate);
  $("send").addEventListener("click", function () {
    if (!canSubmit()) { refreshGate(); return; }
    say("同意已确认，下一步才会发送。 / Consent is on. Sending comes next.");
  });
  refreshGate();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(function () {
      var offline = $("offline");
      if (offline) offline.textContent = "页面已缓存，上传仍需网络 / Page cached. Uploading still needs a network.";
    }).catch(function () {});
  }
})();
