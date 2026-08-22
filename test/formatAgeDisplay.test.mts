import { test } from "node:test";
import assert from "node:assert/strict";
import { formatAgeDisplay } from "../src/wareki.ts";

test("確定表示", () => {
  assert.deepEqual(formatAgeDisplay({ kind: "confirmed", age: 43 }), {
    title: "満43歳",
    copyValue: "43",
  });
});

test("幅表示: 通常ケース", () => {
  assert.deepEqual(formatAgeDisplay({ kind: "range", preBirthdayAge: 42, postBirthdayAge: 43 }), {
    title: "満43歳（誕生日前なら42歳）",
    copyValue: "43",
  });
});

test("幅表示: preBirthdayAgeが負のエッジケースでは幅を出さない", () => {
  assert.deepEqual(formatAgeDisplay({ kind: "range", preBirthdayAge: -1, postBirthdayAge: 0 }), {
    title: "満0歳",
    copyValue: "0",
  });
});

test("未来表示", () => {
  assert.deepEqual(formatAgeDisplay({ kind: "future", yearsUntilBirth: 4 }), {
    title: "あと4年後に誕生",
    copyValue: "4",
  });
});

test("未来表示: yearsUntilBirthが0以下のエッジケースでは「あと0年後」を出さない", () => {
  assert.deepEqual(formatAgeDisplay({ kind: "future", yearsUntilBirth: 0 }), {
    title: "今年誕生予定（まだ誕生日前）",
    copyValue: "0",
  });
});
