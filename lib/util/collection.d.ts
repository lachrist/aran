export type SafeWeakMap<K, V> = {
  __brand: "SafeWeakMap";
  __key: K;
  __val: V;
  $has(this: SafeWeakMap<K, V>, key: K): boolean;
  $get(this: SafeWeakMap<K, V>, key: K): V | undefined;
  $set(this: SafeWeakMap<K, V>, key: K, val: V): void;
  $delete(this: SafeWeakMap<K, V>, key: K): boolean;
};

export type SafeWeakSet<K> = {
  __brand: "SafeWeakSet";
  __key: K;
  $has(this: SafeWeakSet<K>, key: K): boolean;
  $add(this: SafeWeakSet<K>, key: K): void;
  $delete(this: SafeWeakSet<K>, key: K): boolean;
};

export type SafeMap<K, V> = {
  __brand: "SafeMap";
  __key: K;
  __val: V;
  $has(this: SafeMap<K, V>, key: K): boolean;
  $get(this: SafeMap<K, V>, key: K): V | undefined;
  $set(this: SafeMap<K, V>, key: K, value: V): void;
  $delete(this: SafeMap<K, V>, key: K): boolean;
  $clear(this: SafeMap<K, V>): void;
  $keys(this: SafeSet<K>): Iterable<K>;
  $values(this: SafeMap<K, V>): Iterable<V>;
  $entries(this: SafeMap<K, V>): Iterable<[K, V]>;
  $getSize(this: SafeMap<K, V>): number;
};

export type SafeSet<K> = {
  __brand: "SafeSet";
  __key: K;
  $has(this: SafeSet<K>, key: K): boolean;
  $add(this: SafeSet<K>, key: K): void;
  $delete(this: SafeSet<K>, key: K): boolean;
  $clear(this: SafeSet<K>): void;
  $keys(this: SafeSet<K>): Iterable<K>;
  $getSize(this: SafeSet<K>): number;
};
