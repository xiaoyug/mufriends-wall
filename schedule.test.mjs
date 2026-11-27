import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chooseCurrent, nextPageNumber, normalizeList, runningAt, shanghaiDate, shanghaiStamp } from "./schedule.mjs";

var sample = JSON.parse(readFileSync(new URL("./schedule-sample.json", import.meta.url), "utf8"));
var events = normalizeList(sample);

function at(iso) {
  return runningAt(events, Date.parse(iso));
}

test("one session is running on opening afternoon", function () {
  var list = at("2026-11-29T15:00:00+08:00");
  assert.equal(list.length, 1);
  assert.equal(list[0].title, "开幕仪式 / Opening Ceremony");
  assert.equal(chooseCurrent(list).id, list[0].id);
  assert.equal(shanghaiDate(list[0].start), "2026-11-29");
});

test("overlapping sessions pick the one that started latest", function () {
  var list = at("2026-12-02T14:30:00+08:00");
  assert.equal(list.length, 3);
  assert.equal(list[0].start < list[1].start, true);
  var current = chooseCurrent(list);
  assert.equal(Date.parse(current.start), Date.parse("2026-12-02T06:00:00Z"));
  assert.equal(current.title, "越疆机器人工作坊 / DOBOT Robotics Workshop");
});

test("a quiet afternoon has no session", function () {
  assert.equal(at("2026-11-28T15:00:00+08:00").length, 0);
  assert.equal(chooseCurrent([]), null);
});

test("page 2 of the public list is kept, including CJK titles", function () {
  var page2 = {
    data: [{
      id: "3n2yajazg3m3g",
      title: "ClawCon 大会 / ClawCon Conference",
      start_time: "2026-12-06T04:30:00Z",
      end_time: "2026-12-06T09:00:00Z",
      timezone: "Asia/Shanghai",
      status: "published"
    }],
    meta: { next_page: 3 }
  };
  var parsed = normalizeList(page2);
  assert.equal(parsed[0].title, "ClawCon 大会 / ClawCon Conference");
  assert.equal(shanghaiStamp(parsed[0].start), "2026-12-06 12:30");
  assert.equal(shanghaiStamp(parsed[0].end), "2026-12-06 17:00");
  var running = runningAt(parsed, Date.parse("2026-12-06T14:00:00+08:00"));
  assert.equal(chooseCurrent(running).title, "ClawCon 大会 / ClawCon Conference");
  assert.equal(nextPageNumber(page2.meta), 3);
  assert.equal(nextPageNumber({ next_page: null }), 0);
  assert.equal(nextPageNumber({ next_page: 11 }), 0);
  assert.equal(shanghaiDate("2026-11-29T06:00:00Z"), "2026-11-29");
});
