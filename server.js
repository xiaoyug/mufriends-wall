/* 极简静态文件服务器，仅用于本地预览。
 * 支持 --port / --host 参数（Kimi Work 预览会传入），默认 7100 端口。
 * 部署到 Cloudflare Pages 时不需要这个文件。
 */
var http = require("http");
var fs = require("fs");
var path = require("path");

function arg(name, def) {
  var i = process.argv.indexOf("--" + name);
  if (i > -1 && process.argv[i + 1]) return process.argv[i + 1];
  var eq = process.argv.find(function (a) { return a.indexOf("--" + name + "=") === 0; });
  if (eq) return eq.split("=")[1];
  return def;
}

var port = parseInt(process.env.PORT || arg("port", "7100"), 10);
var host = process.env.HOST || arg("host", "0.0.0.0");
var root = __dirname;

var MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".mjs": "text/javascript; charset=utf-8"
};

var scheduleReady = import("./schedule.mjs");

http.createServer(function (req, res) {
  var urlPath = decodeURIComponent(req.url.split("?")[0]);
  if (urlPath === "/events/now") {
    var query = req.url.indexOf("?") >= 0 ? req.url.slice(req.url.indexOf("?")) : "";
    scheduleReady.then(function (schedule) {
      var nowMs = schedule.parseNowParam(new URLSearchParams(query).get("now"), Date.now());
      fs.readFile(path.join(root, "schedule-sample.json"), function (err, buf) {
        if (err) { res.writeHead(500); res.end(); return; }
        var running = schedule.runningAt(schedule.normalizeList(JSON.parse(buf.toString())), nowMs);
        var body = JSON.stringify({ source: "sample", now: new Date(nowMs).toISOString(), events: running });
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
        res.end(body);
      });
    }).catch(function () { res.writeHead(500); res.end(); });
    return;
  }
  if (urlPath === "/upload") {
    var q = req.url.indexOf("?") >= 0 ? req.url.slice(req.url.indexOf("?")) : "";
    res.writeHead(302, { Location: "/upload/" + q });
    res.end();
    return;
  }
  if (urlPath === "/upload/") urlPath = "/upload/index.html";
  if (urlPath === "/") urlPath = "/index.html";
  var file = path.join(root, path.normalize(urlPath));
  if (file.indexOf(root) !== 0) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); res.end("Not found"); return; }
    res.writeHead(200, { "Content-Type": MIME[path.extname(file).toLowerCase()] || "application/octet-stream" });
    res.end(data);
  });
}).listen(port, host, function () {
  console.log("照片墙大屏预览: http://localhost:" + port + "/");
});
