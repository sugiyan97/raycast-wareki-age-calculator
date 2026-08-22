import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAgeInput } from "../src/wareki.ts";

test("正常系: 生年月日（区切りあり・8桁・漢字区切り、西暦/和暦）", () => {
  assert.deepEqual(parseAgeInput("1983/4/1"), { kind: "full", year: 1983, month: 4, day: 1 });
  assert.deepEqual(parseAgeInput("1983-04-01"), { kind: "full", year: 1983, month: 4, day: 1 });
  assert.deepEqual(parseAgeInput("1983.4.1"), { kind: "full", year: 1983, month: 4, day: 1 });
  assert.deepEqual(parseAgeInput("19830401"), { kind: "full", year: 1983, month: 4, day: 1 });
  assert.deepEqual(parseAgeInput("1983年4月1日"), { kind: "full", year: 1983, month: 4, day: 1 });
  assert.deepEqual(parseAgeInput("S58.4.1"), { kind: "full", year: 1983, month: 4, day: 1 });
  assert.deepEqual(parseAgeInput("令和6.5.1"), { kind: "full", year: 2024, month: 5, day: 1 });
  assert.deepEqual(parseAgeInput("令6/5/1"), { kind: "full", year: 2024, month: 5, day: 1 });
  assert.deepEqual(parseAgeInput("R6-5-1"), { kind: "full", year: 2024, month: 5, day: 1 });
  assert.deepEqual(parseAgeInput("S58年4月1日"), { kind: "full", year: 1983, month: 4, day: 1 });
  assert.deepEqual(parseAgeInput("昭和58年4月1日"), { kind: "full", year: 1983, month: 4, day: 1 });
});

test("正常系: 年のみ（西暦/和暦）", () => {
  assert.deepEqual(parseAgeInput("1983"), { kind: "year", year: 1983 });
  assert.deepEqual(parseAgeInput("S58"), { kind: "year", year: 1983 });
  assert.deepEqual(parseAgeInput("令和8"), { kind: "year", year: 2026 });
});

test("正常系: 閏日・未来年", () => {
  assert.deepEqual(parseAgeInput("2000/2/29"), { kind: "full", year: 2000, month: 2, day: 29 });
  assert.deepEqual(parseAgeInput("2030"), { kind: "year", year: 2030 });
});

test("異常系: 暦として不正な日付は年のみにフォールバックせず null", () => {
  assert.equal(parseAgeInput("2001/2/29"), null);
  assert.equal(parseAgeInput("1983/13/1"), null);
  assert.equal(parseAgeInput("1983/4/31"), null);
  assert.equal(parseAgeInput("19831301"), null);
});

test("異常系: 区切り混在・2桁年・不正文字列・空文字", () => {
  assert.equal(parseAgeInput("1983/4-1"), null);
  assert.equal(parseAgeInput("83/4/1"), null);
  assert.equal(parseAgeInput("0000/1/1"), null);
  assert.equal(parseAgeInput("S0"), null);
  assert.equal(parseAgeInput("S0.4.1"), null);
  assert.equal(parseAgeInput("令和"), null);
  assert.equal(parseAgeInput("R"), null);
  assert.equal(parseAgeInput("abc"), null);
  assert.equal(parseAgeInput(""), null);
  assert.equal(parseAgeInput("   "), null);
  assert.equal(parseAgeInput("１９８３"), null);
});

test("境界値: 元号開始年", () => {
  assert.deepEqual(parseAgeInput("1868"), { kind: "year", year: 1868 });
  assert.deepEqual(parseAgeInput("1912"), { kind: "year", year: 1912 });
  assert.deepEqual(parseAgeInput("1926"), { kind: "year", year: 1926 });
  assert.deepEqual(parseAgeInput("1989"), { kind: "year", year: 1989 });
  assert.deepEqual(parseAgeInput("2019"), { kind: "year", year: 2019 });
  assert.deepEqual(parseAgeInput("M1"), { kind: "year", year: 1868 });
  assert.deepEqual(parseAgeInput("T1"), { kind: "year", year: 1912 });
  assert.deepEqual(parseAgeInput("S1"), { kind: "year", year: 1926 });
  assert.deepEqual(parseAgeInput("H1"), { kind: "year", year: 1989 });
  assert.deepEqual(parseAgeInput("R1"), { kind: "year", year: 2019 });
});
