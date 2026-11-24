/* MuFriends 照片墙 Worker
 * 1. /proxy/* 反向代理到 Supabase（REST + Storage），解决国内直连 supabase.co 不稳定
 * 2. 其余路径走静态资产（大屏页面本身）
 */

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

    return env.ASSETS.fetch(request);
  }
};
