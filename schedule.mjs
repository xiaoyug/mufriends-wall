// Current muShenzhen sessions from the public Social Layer API.
// GET https://api.sola.day/api/v1/events?group_id=3mywjlvveoge2&limit=100&page=N
// No collection filter: upcoming and past are both included, then filtered by time.
// The website's page=2 is a 20-item view of the same list. Follow next_page, cap 10.
// No auth. Times are UTC. Group page: https://sola.day/event/mushenzhen
// There is no public iCal feed. This list endpoint is the clean source.

export var GROUP_ID = "3mywjlvveoge2";
export var SOLA_LIST = "https://api.sola.day/api/v1/events?group_id=3mywjlvveoge2&limit=100";
export var PAGE_CAP = 10;
export var DEFAULT_NAME = "muShenzhen 2026";

export function nextPageNumber(meta) {
  if (!meta || meta.next_page == null || meta.next_page === "") return 0;
  var n = Number(meta.next_page);
  if (!n || n < 1 || n > PAGE_CAP) return 0;
  return n;
}

export function parseNowParam(value, fallbackMs) {
  if (!value) return fallbackMs;
  var text = String(value).trim().replace(" ", "+");
  var ms = Date.parse(text);
  if (isNaN(ms)) return fallbackMs;
  return ms;
}

export function normalizeList(payload) {
  var raw = [];
  if (payload && payload.data) raw = payload.data;
  else if (payload && payload.events) raw = payload.events;
  var out = [];
  for (var i = 0; i < raw.length; i++) {
    var ev = raw[i] || {};
    var status = ev.status || "published";
    if (status !== "published" && status !== "closed") continue;
    var start = ev.start || ev.start_time;
    var end = ev.end || ev.end_time;
    var title = ev.title || "";
    if (!ev.id || !title || !start || !end) continue;
    out.push({
      id: String(ev.id),
      title: title,
      start: start,
      end: end,
      timezone: ev.timezone || "Asia/Shanghai"
    });
  }
  return out;
}

// start <= now < end, earliest start first. Same start: title order.
export function runningAt(events, nowMs) {
  var list = [];
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var start = Date.parse(ev.start);
    var end = Date.parse(ev.end);
    if (isNaN(start) || isNaN(end)) continue;
    if (start <= nowMs && nowMs < end) list.push(ev);
  }
  list.sort(function (a, b) {
    var diff = Date.parse(a.start) - Date.parse(b.start);
    if (diff !== 0) return diff;
    return String(a.title).localeCompare(String(b.title));
  });
  return list;
}

// Last item is the one that started most recently.
export function chooseCurrent(running) {
  if (!running || !running.length) return null;
  return running[running.length - 1];
}

export function shanghaiDate(iso) {
  return shanghaiStamp(iso).slice(0, 10);
}

export function shanghaiStamp(iso) {
  var parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(iso));
  var map = {};
  for (var i = 0; i < parts.length; i++) map[parts[i].type] = parts[i].value;
  return map.year + "-" + map.month + "-" + map.day + " " + map.hour + ":" + map.minute;
}

var api = {
  GROUP_ID: GROUP_ID,
  SOLA_LIST: SOLA_LIST,
  DEFAULT_NAME: DEFAULT_NAME,
  PAGE_CAP: PAGE_CAP,
  nextPageNumber: nextPageNumber,
  parseNowParam: parseNowParam,
  normalizeList: normalizeList,
  runningAt: runningAt,
  chooseCurrent: chooseCurrent,
  shanghaiDate: shanghaiDate,
  shanghaiStamp: shanghaiStamp
};
globalThis.MushenzhenSchedule = api;
