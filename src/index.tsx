import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import React from "react";

const Wareki = {
  reiwa: { start: 2019, label: "令和", prefixes: ["令和", "令", "R"] },
  heisei: { start: 1989, label: "平成", prefixes: ["平成", "平", "H"] },
  showa: { start: 1926, label: "昭和", prefixes: ["昭和", "昭", "S"] },
  taisho: { start: 1912, label: "大正", prefixes: ["大正", "大", "T"] },
  meiji: { start: 1868, label: "明治", prefixes: ["明治", "明", "M"] },
};

type WarekiKey = keyof typeof Wareki;

const calc = (targetYear: number) => {
  return Object.keys(Wareki).reduce(
    (prev, current) => {
      const { start, label } = Wareki[current as WarekiKey];
      if (targetYear < start) return prev;

      return [...prev, `${label}${targetYear - start + 1}年`];
    },
    [`西暦${targetYear}年`],
  );
};

// こんな感じの正規表現を生成する
// ^(令和|令|R|平成|平|H|昭和|昭|S|大正|大|T|明治|明|M)(\d+)
const warekiExtractRegex = () => {
  const allPrefixes = Object.keys(Wareki).reduce<string[]>((prev, current) => {
    const { prefixes } = Wareki[current as WarekiKey];
    return [...prev, ...prefixes];
  }, []);

  return new RegExp(`^(${allPrefixes.join("|")})(\\d+)`);
};

const convertYear = (sourceYear: string) => {
  // 西暦
  if (Number(sourceYear) > 0) {
    return Number(sourceYear);
  }

  // 和暦
  const [_, sourceEraName, sourceEraYear] = sourceYear.match(warekiExtractRegex()) ?? [];
  for (const [_, { start, prefixes }] of Object.entries(Wareki)) {
    if (prefixes.findIndex((a) => a === sourceEraName) >= 0) {
      // 各年号の開始年+各年号の年数-1
      return start + Number(sourceEraYear) - 1;
    }
  }

  return NaN;
};

// ---- 年齢計算（issue #3） ----
// 純粋な計算ロジックのみ。文字列パース（issue #4）やUI表示（issue #7）は範囲外。
// 既存の和暦⇔西暦変換ロジックには手を入れない（デグレ防止）。

type AgeInputYearOnly = { kind: "year"; year: number };
type AgeInputFullDate = { kind: "full"; year: number; month: number; day: number };
// month は 1-12（Dateコンストラクタの0始まりとは異なる。文字列パース結果と自然に対応させるため）
export type AgeInput = AgeInputYearOnly | AgeInputFullDate;

export type AgeResult =
  | { kind: "confirmed"; age: number }
  | { kind: "range"; preBirthdayAge: number; postBirthdayAge: number }
  | { kind: "future"; yearsUntilBirth: number };

// (year, month, day) を1つの整数キーに変換して比較する。Dateオブジェクト同士を
// </>で比較すると時刻・タイムゾーン成分に影響されうるため、これを避ける。
function toComparableKey(year: number, month: number, day: number): number {
  return year * 10000 + month * 100 + day;
}

function calculateAgeFromFullDate(
  birthYear: number,
  birthMonth: number,
  birthDay: number,
  referenceDate: Date,
): AgeResult {
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;
  const refDay = referenceDate.getDate();

  const birthKey = toComparableKey(birthYear, birthMonth, birthDay);
  const refKey = toComparableKey(refYear, refMonth, refDay);

  if (birthKey > refKey) {
    return { kind: "future", yearsUntilBirth: birthYear - refYear };
  }

  // 今年の誕生日（に相当する日）を迎えたか。(month, day) の整数比較のみで判定するため、
  // 2/29生まれは229という値になり、平年でも3/1(=301)の時点で「到来済み」と自然に判定される。
  // 「2/29生まれは平年では3/1に加齢」という仕様がDateの自動繰り上げに頼らず素直に成立する。
  const birthdayThisYearKey = toComparableKey(refYear, birthMonth, birthDay);
  const hasHadBirthdayThisYear = birthdayThisYearKey <= refKey; // <= : 当日は加齢済み

  const age = hasHadBirthdayThisYear ? refYear - birthYear : refYear - birthYear - 1;
  return { kind: "confirmed", age };
}

function calculateAgeRangeFromYear(birthYear: number, referenceDate: Date): AgeResult {
  const refYear = referenceDate.getFullYear();

  if (birthYear > refYear) {
    return { kind: "future", yearsUntilBirth: birthYear - refYear };
  }

  const postBirthdayAge = refYear - birthYear;
  const preBirthdayAge = postBirthdayAge - 1;
  return { kind: "range", preBirthdayAge, postBirthdayAge };
}

export function calculateAge(input: AgeInput, referenceDate: Date = new Date()): AgeResult {
  return input.kind === "full"
    ? calculateAgeFromFullDate(input.year, input.month, input.day, referenceDate)
    : calculateAgeRangeFromYear(input.year, referenceDate);
}

export default function Command() {
  const [searchYear, setSearchYear] = React.useState("");

  const year = convertYear(searchYear);
  const items = isNaN(year) ? [] : calc(year);

  return (
    <List
      isLoading={items.length === 0}
      searchBarPlaceholder="Enter year of 西暦 or 和暦"
      enableFiltering={false}
      onSearchTextChange={setSearchYear}
    >
      {items.map((item) => {
        return (
          <List.Item
            key={item}
            title={item}
            actions={<Actions item={item} />}
            icon={{ source: Icon.Circle, tintColor: Color.Green }}
          />
        );
      })}
    </List>
  );
}

function Actions({ item }: { item: string }) {
  return (
    <ActionPanel title="Wareki - 和暦西暦変換">
      <Action.CopyToClipboard content={item} title="Copy" />
    </ActionPanel>
  );
}
