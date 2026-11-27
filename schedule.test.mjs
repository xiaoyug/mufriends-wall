import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { chooseCurrent, normalizeList, runningAt, shanghaiDate } from "./schedule.mjs";

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
