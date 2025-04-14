export type WeakMap<K extends object, V> = {
  __brand: "WeakMap";
  __key: K;
  __val: V;
  get: (this: WeakMap<K, V>, key: object) => V | undefined;
  set: (this: WeakMap<K, V>, key: K, value: V) => WeakMap<K, V>;
};

export type WeakSet<K extends object> = {
  __brand: "WeakSet";
  __key: K;
  has: (this: WeakSet<K>, key: object) => boolean;
  add: (this: WeakSet<K>, key: K) => WeakSet<K>;
};
