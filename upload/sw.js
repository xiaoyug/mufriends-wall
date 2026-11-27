// 只缓存上传页外壳。上传请求走 /proxy，不能进缓存。
// 改了被缓存的文件就把 CACHE 版本号抬高，并同步 index.html 页脚的 upload vN。
const CACHE = "upload-v11-alert";

const ASSETS = [
  "./",
  "./index.html",
  "./config.js",
  "./app.js",
  "./mushenzhen-full-green.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("upload-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  var url = new URL(event.request.url);
  if (url.pathname.indexOf("/proxy/") !== -1) return;
  event.respondWith(caches.match(event.request, { ignoreSearch: true }).then((hit) => hit || fetch(event.request)));
});
