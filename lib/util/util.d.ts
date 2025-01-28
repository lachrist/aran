declare const __brand: unique symbol;

export type Brand<T, B> = T & { [__brand]: B };

export type ValueOf<T> = T[keyof T];

export type JsonPrimitive = null | boolean | number | string;

export type Json = JsonPrimitive | Json[] | { [key in string]?: Json };

export type Merge<X, Y> = {
  [k in keyof X | keyof Y]: k extends keyof Y
    ? Y[k]
    : k extends keyof X
      ? X[k]
      : never;
};

export type MergeDefault<X, Y> = {
  [k in keyof X]: Y extends { [k2 in k]: infer V } ? V : X[k];
};

export type KeyOfUnion<T> = T extends T ? keyof T : never;

type GetDefault<O, K extends keyof O, D> = O extends { [k in K]: infer V }
  ? V
  : D;

export type AssertNever<_X extends never> = never;
