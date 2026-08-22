import { test } from "node:test";
import assert from "node:assert/strict";
import { formatWarekiDate } from "../src/wareki.ts";

test("正常系: 各元号への振り分け", () => {
  assert.equal(formatWarekiDate({ year: 1983, month: 4, day: 1 }), "昭和58年4月1日");
  assert.equal(formatWarekiDate({ year: 2000, month: 2, day: 29 }), "平成12年2月29日");
  assert.equal(formatWarekiDate({ year: 2026, month: 8, day: 21 }), "令和8年8月21日");
  assert.equal(formatWarekiDate({ year: 1912, month: 7, day: 30 }), "大正1年7月30日");
  assert.equal(formatWarekiDate({ year: 1868, month: 1, day: 1 }), "明治1年1月1日");
});

test("境界値: 元号切り替わり年", () => {
  assert.equal(formatWarekiDate({ year: 1989, month: 1, day: 8 }), "平成1年1月8日");
  assert.equal(formatWarekiDate({ year: 2019, month: 5, day: 1 }), "令和1年5月1日");
});

test("異常系: 明治より前は null", () => {
  assert.equal(formatWarekiDate({ year: 1867, month: 12, day: 31 }), null);
});
