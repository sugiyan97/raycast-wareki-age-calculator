// 和暦テーブルおよび年齢関連の純粋ロジック（JSX・@raycast/api非依存）。
// index.tsx（UI）から分離しているのは、node --test でユニットテストするため
// （@raycast/api は Raycast 実行環境専用でありプレーンなNodeからはimportできない）。

export const Wareki = {
  reiwa: { start: 2019, label: "令和", prefixes: ["令和", "令", "R"] },
  heisei: { start: 1989, label: "平成", prefixes: ["平成", "平", "H"] },
  showa: { start: 1926, label: "昭和", prefixes: ["昭和", "昭", "S"] },
  taisho: { start: 1912, label: "大正", prefixes: ["大正", "大", "T"] },
  meiji: { start: 1868, label: "明治", prefixes: ["明治", "明", "M"] },
};

export type WarekiKey = keyof typeof Wareki;

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

// ---- 生年月日入力パース（issue #4） ----
// 入力文字列を AgeInput（年のみ / 生年月日）に判別してパースする純粋関数。
// UI表示（issue #7）は範囲外。日付ライブラリは使わず標準機能のみで実装する。
// 既存の変換ロジック（Wareki / warekiExtractRegex / convertYear / calc、index.tsx側）には手を入れない（デグレ防止）。

// warekiExtractRegex() は ^ のみアンカーで末尾を保証しないため（"S58.4.1" を S+58 として
// 部分一致してしまう）、年のみ判定にそのまま流用すると生年月日入力を誤判定する。
// そのため既存関数は変更せず、Wareki テーブルを共有した完全アンカー用の断片を別途生成する。
// Object.values(Wareki) の順序と各 prefixes の順序（長い表記が先: ["令和","令","R"]）に
// 交替順が依存する（この並びが崩れると短い表記に先食いされる）。
const warekiPrefixPattern = (): string =>
  Object.values(Wareki)
    .flatMap(({ prefixes }) => prefixes)
    .join("|");

const warekiStartYearOf = (prefix: string): number | null => {
  for (const { start, prefixes } of Object.values(Wareki)) {
    if (prefixes.includes(prefix)) return start;
  }
  return null;
};

// 元号年 → 西暦年。convertYear と同じ「開始年 + 元号年 - 1」の式を踏襲する。
const toWesternYear = (prefix: string, eraYear: number): number | null => {
  const start = warekiStartYearOf(prefix);
  if (start === null || eraYear < 1) return null;
  return start + eraYear - 1;
};

const WAREKI_PREFIX_PATTERN = warekiPrefixPattern();

// 西暦・区切りあり: 1983/4/1 / 1983-04-01 / 1983.4.1（区切り文字は前後で一致必須）
const WESTERN_DATE_REGEX = new RegExp("^(\\d{4})([/.-])(\\d{1,2})\\2(\\d{1,2})$");
// 西暦・8桁: 19830401
const WESTERN_COMPACT_DATE_REGEX = /^(\d{4})(\d{2})(\d{2})$/;
// 西暦・漢字区切り: 1983年4月1日
const WESTERN_KANJI_DATE_REGEX = /^(\d{4})年(\d{1,2})月(\d{1,2})日?$/;
// 和暦・区切りあり: S58.4.1 / 令和6.5.1 / R6-5-1
const WAREKI_DATE_REGEX = new RegExp(`^(${WAREKI_PREFIX_PATTERN})(\\d+)([/.-])(\\d{1,2})\\3(\\d{1,2})$`);
// 和暦・漢字区切り: S58年4月1日 / 昭和58年4月1日
const WAREKI_KANJI_DATE_REGEX = new RegExp(`^(${WAREKI_PREFIX_PATTERN})(\\d+)年(\\d{1,2})月(\\d{1,2})日?$`);
// 年のみ・西暦: 1983（4桁固定。2桁年は 1983/0083 の曖昧性があるため非対応）
const WESTERN_YEAR_REGEX = /^\d{1,4}$/;
// 年のみ・和暦: S58
const WAREKI_YEAR_REGEX = new RegExp(`^(${WAREKI_PREFIX_PATTERN})(\\d+)$`);

const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// 実在する暦日かを判定する。Date は使わない（new Date(83, 0, 1) が1983年になる等の
// 2桁年の暗黙補正やタイムゾーンの影響を避けるため）。
const isValidCalendarDate = (year: number, month: number, day: number): boolean => {
  if (year < 1 || month < 1 || month > 12 || day < 1) return false;
  const lastDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  return day <= lastDay;
};

const toFullDateInput = (year: number, month: number, day: number): AgeInput | null =>
  isValidCalendarDate(year, month, day) ? { kind: "full", year, month, day } : null;

const parseWesternDate = (input: string): AgeInput | null => {
  const matched = input.match(WESTERN_DATE_REGEX);
  if (!matched) return null;
  const [, year, , month, day] = matched;
  return toFullDateInput(Number(year), Number(month), Number(day));
};

const parseWesternCompactDate = (input: string): AgeInput | null => {
  const matched = input.match(WESTERN_COMPACT_DATE_REGEX);
  if (!matched) return null;
  const [, year, month, day] = matched;
  return toFullDateInput(Number(year), Number(month), Number(day));
};

const parseWesternKanjiDate = (input: string): AgeInput | null => {
  const matched = input.match(WESTERN_KANJI_DATE_REGEX);
  if (!matched) return null;
  const [, year, month, day] = matched;
  return toFullDateInput(Number(year), Number(month), Number(day));
};

const parseWarekiDate = (input: string): AgeInput | null => {
  const matched = input.match(WAREKI_DATE_REGEX);
  if (!matched) return null;
  const [, prefix, eraYear, , month, day] = matched;
  const year = toWesternYear(prefix, Number(eraYear));
  if (year === null) return null;
  return toFullDateInput(year, Number(month), Number(day));
};

const parseWarekiKanjiDate = (input: string): AgeInput | null => {
  const matched = input.match(WAREKI_KANJI_DATE_REGEX);
  if (!matched) return null;
  const [, prefix, eraYear, month, day] = matched;
  const year = toWesternYear(prefix, Number(eraYear));
  if (year === null) return null;
  return toFullDateInput(year, Number(month), Number(day));
};

const parseWesternYear = (input: string): AgeInput | null => {
  if (!WESTERN_YEAR_REGEX.test(input)) return null;
  const year = Number(input);
  return year >= 1 ? { kind: "year", year } : null;
};

const parseWarekiYear = (input: string): AgeInput | null => {
  const matched = input.match(WAREKI_YEAR_REGEX);
  if (!matched) return null;
  const [, prefix, eraYear] = matched;
  const year = toWesternYear(prefix, Number(eraYear));
  return year === null ? null : { kind: "year", year };
};

// 検索バーの入力文字列を AgeInput に変換する。判別できない場合は null（例外は投げない）。
// 生年月日形式を先に試す。上記の正規表現は完全アンカーで相互排他のため実際には順序非依存だが、
// 「日付形式が年のみ形式より優先」という意図を順序として明示しておく。
// 日付の形に一致したが暦として不正な入力（例: 2001/2/29）は年のみ入力にフォールバックせず null を返す。
export function parseAgeInput(source: string): AgeInput | null {
  const input = source.trim();
  if (input === "") return null;

  return (
    parseWesternDate(input) ??
    parseWesternCompactDate(input) ??
    parseWesternKanjiDate(input) ??
    parseWarekiDate(input) ??
    parseWarekiKanjiDate(input) ??
    parseWesternYear(input) ??
    parseWarekiYear(input)
  );
}

// ---- 年齢表示整形（issue #7） ----
// AgeResult を List UI に表示するタイトル文字列と、Copy to Clipboard でコピーする
// 数値文字列に変換する。JSX には依存しない純粋関数。

export type AgeDisplay = { title: string; copyValue: string };

export function formatAgeDisplay(result: AgeResult): AgeDisplay {
  switch (result.kind) {
    case "confirmed":
      return { title: `満${result.age}歳`, copyValue: String(result.age) };
    case "range":
      // 生年 === 基準年の場合 preBirthdayAge が -1 になり意味を持たないため、
      // 幅表示ではなく確定表示にする（生年月日入力ではなく年のみ入力で、かつ
      // 誕生日前の年齢という概念が成立しないケース）。
      if (result.preBirthdayAge < 0) {
        return { title: `満${result.postBirthdayAge}歳`, copyValue: String(result.postBirthdayAge) };
      }
      return {
        title: `満${result.postBirthdayAge}歳（誕生日前なら${result.preBirthdayAge}歳）`,
        copyValue: String(result.postBirthdayAge),
      };
    case "future":
      // 生年月日が基準日と同じ年で、まだ誕生日前のケースは yearsUntilBirth が0になる。
      // 「あと0年後」は日本語として意味を成さないため、年数を出さない表現にする。
      if (result.yearsUntilBirth <= 0) {
        return { title: "今年誕生予定（まだ誕生日前）", copyValue: "0" };
      }
      return { title: `あと${result.yearsUntilBirth}年後に誕生`, copyValue: String(result.yearsUntilBirth) };
  }
}

// ---- 和暦の生年月日表示（issue #7フォローアップ） ----
// 生年月日入力時、既存の calc()/convertYear（年のみ用）とは別に、日付を保持したまま
// 和暦表示を作る。既存の変換ロジックには手を入れず、追加関数として実装する。
export function formatWarekiDate(input: { year: number; month: number; day: number }): string | null {
  const era = Object.values(Wareki).find(({ start }) => input.year >= start);
  if (!era) return null;
  return `${era.label}${input.year - era.start + 1}年${input.month}月${input.day}日`;
}
