/* MuFriends 照片墙 Worker
 * 1. /proxy/* 反向代理到 Supabase（REST + Storage），解决国内直连 supabase.co 不稳定
 * 2. /events/now 只读：从 sola 取正在进行的场次。Sunny 部署后才上线。
 * 3. 其余路径走静态资产（大屏页面本身）
 */
import { SOLA_LIST, normalizeList, nextPageNumber, parseNowParam, runningAt } from "./schedule.mjs";

var UPSTREAM = "https://kqttuewfmvuuohvqbhel.supabase.co";

var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-client-info, x-upsert, prefer, accept-profile, content-profile, range, cache-control",
  "Access-Control-Expose-Headers": "content-range, range",
  "Access-Control-Max-Age": "86400"
};

export default {
  async fetch(request, env) {
    var url = new URL(request.url);

    if (url.pathname === "/events/now") {
      return eventsNow(url);
    }

    if (url.pathname.indexOf("/proxy/") === 0) {
      // 预检请求直接放行
      if (request.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS });
      }
      var target = UPSTREAM + url.pathname.slice(6) + url.search; // 去掉 /proxy 前缀
      var headers = new Headers(request.headers);
      headers.delete("host");
      headers.delete("origin");
      headers.delete("referer");
      var hasBody = request.method !== "GET" && request.method !== "HEAD";
      var upstream = await fetch(target, {
        method: request.method,
        headers: headers,
        body: hasBody ? request.body : undefined,
        redirect: "follow"
      });
      var outHeaders = new Headers(upstream.headers);
      for (var k in CORS) outHeaders.set(k, CORS[k]);
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: outHeaders
      });
    }

    // 观众上传页和墙同一域名：/upload 与 /upload/
    if (url.pathname === "/upload") {
      url.pathname = "/upload/";
      return Response.redirect(url.toString(), 302);
    }
    if (url.pathname === "/upload/") {
      var assetUrl = new URL(request.url);
      assetUrl.pathname = "/upload/index.html";
      return env.ASSETS.fetch(new Request(assetUrl, request));
    }

    return env.ASSETS.fetch(request);
  }
};

// The full list is cached for 8 minutes. Each request then filters by now.
async function solaList() {
  var cache = caches.default;
  var key = new Request(SOLA_LIST);
  var hit = await cache.match(key);
  if (hit) return hit.json();
  var merged = [];
  var page = 1;
  while (page) {
    var res = await fetch(SOLA_LIST + "&page=" + page, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error("sola " + res.status);
    var data = await res.json();
    var chunk = data.data || [];
    for (var i = 0; i < chunk.length; i++) merged.push(chunk[i]);
    page = chunk.length ? nextPageNumber(data.meta) : 0;
  }
  var body = { data: merged };
  var stored = new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", "cache-control": "public, max-age=480" }
  });
  await cache.put(key, stored);
  return body;
}

async function eventsNow(url) {
  var nowMs = parseNowParam(url.searchParams.get("now"), Date.now());
  var headers = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" };
  try {
    var payload = await solaList();
    var events = runningAt(normalizeList(payload), nowMs);
    return new Response(JSON.stringify({ source: "sola", now: new Date(nowMs).toISOString(), events: events }), { status: 200, headers: headers });
  } catch (err) {
    return new Response(JSON.stringify({ source: "error", now: new Date(nowMs).toISOString(), events: [] }), { status: 502, headers: headers });
  }
}
