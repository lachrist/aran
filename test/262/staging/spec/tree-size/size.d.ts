export type Size = number & { __brand: Size };

export type Registery<V extends object> = {
  __brand: "Registery";
  __value: V;
};

export type Node<V> = {
  callee: V;
  that: V;
  input: V[];
  result: V;
};
