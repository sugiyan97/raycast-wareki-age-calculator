import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import React from "react";
import { Wareki, WarekiKey, calculateAge, formatAgeDisplay, formatWarekiDate, parseAgeInput } from "./wareki";

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

export default function Command() {
  const [searchYear, setSearchYear] = React.useState("");

  const ageInput = parseAgeInput(searchYear);
  const ageDisplay = ageInput ? formatAgeDisplay(calculateAge(ageInput)) : null;
  const warekiDateLine = ageInput?.kind === "full" ? formatWarekiDate(ageInput) : null;

  const year = convertYear(searchYear);
  // 生年月日入力（ageInput.kind === "full"）のときは、既存の convertYear/calc による
  // 年のみの元号一覧は出さない（生年月日を西暦年として誤読するケースがあるため。例:
  // "19830401" は西暦19830401年と誤読される）。既存の変換ロジック自体は変更しない。
  const items = isNaN(year) || ageInput?.kind === "full" ? [] : calc(year);

  return (
    <List
      isLoading={items.length === 0 && ageDisplay === null}
      searchBarPlaceholder="Enter year of 西暦 or 和暦"
      enableFiltering={false}
      onSearchTextChange={setSearchYear}
    >
      {items.map((item) => {
        return (
          <List.Item
            key={item}
            title={item}
            actions={<Actions copyValue={item} />}
            icon={{ source: Icon.Circle, tintColor: Color.Green }}
          />
        );
      })}
      {warekiDateLine && (
        <List.Item
          key="wareki-date"
          title={warekiDateLine}
          actions={<Actions copyValue={warekiDateLine} />}
          icon={{ source: Icon.Circle, tintColor: Color.Green }}
        />
      )}
      {ageDisplay && (
        <List.Item
          key="age"
          title={ageDisplay.title}
          actions={<Actions copyValue={ageDisplay.copyValue} />}
          icon={{ source: Icon.Calendar, tintColor: Color.Blue }}
        />
      )}
    </List>
  );
}

function Actions({ copyValue }: { copyValue: string }) {
  return (
    <ActionPanel title="Wareki - 和暦西暦変換">
      <Action.CopyToClipboard content={copyValue} title="Copy" />
    </ActionPanel>
  );
}
