export type Selection<K extends string> = {
  exact: Set<K>;
  group: RegExp[];
};

export type SelectionEntry<K extends string, V> = [Selection<K>, V];

export type SelectionMapping<K extends string, V> = SelectionEntry<K, V>[];
