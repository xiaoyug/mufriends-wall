/* 上传页行为。样式在 index.html。
 * 这一步只负责选照片和预览，还不上传。
 */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var selected = null;
  var previewUrl = "";

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
    };
    img.onerror = function () {
      URL.revokeObjectURL(url);
      say("这张照片读不了，请换一张 JPG 或 PNG。 / Could not read that photo. Try a JPG or PNG.");
    };
    img.src = url;
  }

  $("photo").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;
    showPreview(file);
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").then(function () {
      var offline = $("offline");
      if (offline) offline.textContent = "页面已缓存，上传仍需网络 / Page cached. Uploading still needs a network.";
    }).catch(function () {});
  }
})();
