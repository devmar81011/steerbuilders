import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

type SortState<T extends string> = {
  key: T | null;
  direction: SortDirection;
};

type Options<T extends string> = {
  defaultKey?: T;
  defaultDirection?: SortDirection;
};

export function getSortValue(
  value: unknown
): string | number {
  if (value == null) return "";
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  return String(value).toLowerCase();
}

export function sortRows<TRow, TKey extends string>(
  rows: TRow[],
  sort: SortState<TKey>,
  getValue: (row: TRow, key: TKey) => unknown
): TRow[] {
  if (!sort.key) return rows;

  const direction = sort.direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    const av = getSortValue(getValue(a, sort.key!));
    const bv = getSortValue(getValue(b, sort.key!));

    if (typeof av === "number" && typeof bv === "number") {
      return (av - bv) * direction;
    }

    return String(av).localeCompare(String(bv), undefined, {
      numeric: true,
      sensitivity: "base",
    }) * direction;
  });
}

export function useTableSort<TKey extends string>(
  options: Options<TKey> = {}
) {
  const [sort, setSort] = useState<SortState<TKey>>({
    key: options.defaultKey ?? null,
    direction: options.defaultDirection ?? "asc",
  });

  function toggleSort(key: TKey) {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  }

  return { sort, toggleSort, setSort };
}

export function useSortedRows<TRow, TKey extends string>(
  rows: TRow[],
  sort: SortState<TKey>,
  getValue: (row: TRow, key: TKey) => unknown
) {
  return useMemo(
    () => sortRows(rows, sort, getValue),
    [rows, sort, getValue]
  );
}
