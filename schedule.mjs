// Current muShenzhen sessions from the public Social Layer API.
// GET https://api.sola.day/api/v1/events?group_id=3mywjlvveoge2&limit=100
// No auth. Times are UTC. Group page: https://sola.day/event/mushenzhen
// There is no public iCal feed. This list endpoint is the clean source.

export var GROUP_ID = "3mywjlvveoge2";
export var SOLA_LIST = "https://api.sola.day/api/v1/events?group_id=3mywjlvveoge2&limit=100";
export var DEFAULT_NAME = "muShenzhen 2026";

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
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(iso));
}

var api = {
  GROUP_ID: GROUP_ID,
  SOLA_LIST: SOLA_LIST,
  DEFAULT_NAME: DEFAULT_NAME,
  parseNowParam: parseNowParam,
  normalizeList: normalizeList,
  runningAt: runningAt,
  chooseCurrent: chooseCurrent,
  shanghaiDate: shanghaiDate
};
globalThis.MushenzhenSchedule = api;
