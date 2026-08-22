import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateAge } from "../src/wareki.ts";

// docs/requirements.md §9 の基準日に合わせる
const REFERENCE_DATE = new Date(2026, 7, 21); // 2026-08-21

test("確定表示: 生年月日入力（誕生日前後・当日）", () => {
  assert.deepEqual(calculateAge({ kind: "full", year: 1983, month: 4, day: 1 }, REFERENCE_DATE), {
    kind: "confirmed",
    age: 43,
  });
  assert.deepEqual(calculateAge({ kind: "full", year: 1983, month: 12, day: 1 }, REFERENCE_DATE), {
    kind: "confirmed",
    age: 42,
  });
  assert.deepEqual(calculateAge({ kind: "full", year: 1983, month: 8, day: 21 }, REFERENCE_DATE), {
    kind: "confirmed",
    age: 43,
  });
});

test("確定表示: 閏日生まれ（平年では3/1に加齢）", () => {
  assert.deepEqual(calculateAge({ kind: "full", year: 2000, month: 2, day: 29 }, REFERENCE_DATE), {
    kind: "confirmed",
    age: 26,
  });
});

test("未来表示: 生年月日・年のみのどちらも「あと◯年後に誕生」", () => {
  assert.deepEqual(calculateAge({ kind: "full", year: 2030, month: 1, day: 1 }, REFERENCE_DATE), {
    kind: "future",
    yearsUntilBirth: 4,
  });
  assert.deepEqual(calculateAge({ kind: "year", year: 2030 }, REFERENCE_DATE), {
    kind: "future",
    yearsUntilBirth: 4,
  });
});

test("未来表示: 生年月日が基準日と同年内でまだ誕生日前（yearsUntilBirthが0になるケース）", () => {
  assert.deepEqual(calculateAge({ kind: "full", year: 2026, month: 12, day: 1 }, REFERENCE_DATE), {
    kind: "future",
    yearsUntilBirth: 0,
  });
});

test("境界値: 閏日生まれの加齢日（平年は3/1、うるう年は2/29）", () => {
  assert.deepEqual(calculateAge({ kind: "full", year: 2000, month: 2, day: 29 }, new Date(2026, 1, 28)), {
    kind: "confirmed",
    age: 25,
  });
  assert.deepEqual(calculateAge({ kind: "full", year: 2000, month: 2, day: 29 }, new Date(2026, 2, 1)), {
    kind: "confirmed",
    age: 26,
  });
  assert.deepEqual(calculateAge({ kind: "full", year: 2000, month: 2, day: 29 }, new Date(2024, 1, 29)), {
    kind: "confirmed",
    age: 24,
  });
  assert.deepEqual(calculateAge({ kind: "full", year: 2000, month: 2, day: 29 }, new Date(2024, 1, 28)), {
    kind: "confirmed",
    age: 23,
  });
});

test("幅表示: 年のみ入力の通常ケース", () => {
  assert.deepEqual(calculateAge({ kind: "year", year: 1983 }, REFERENCE_DATE), {
    kind: "range",
    preBirthdayAge: 42,
    postBirthdayAge: 43,
  });
});

test("幅表示: 生年が基準年と同じ場合（preBirthdayAgeが負になるエッジケース）", () => {
  assert.deepEqual(calculateAge({ kind: "year", year: 2026 }, REFERENCE_DATE), {
    kind: "range",
    preBirthdayAge: -1,
    postBirthdayAge: 0,
  });
});
