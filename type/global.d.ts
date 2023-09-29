export {};

declare const __brand: unique symbol;

declare global {
  type GenerateEnumArray<T extends string, A extends string[] = []> = {
    done: A;
    next: T extends `${infer Head}${infer Tail}`
      ? GenerateEnumArray<Tail, [...A, Head]>
      : T extends ""
      ? "done"
      : never;
  }[T extends "" ? "done" : "next"];
  type Brand<T, B> = T & { [__brand]: B };
  type Json =
    | null
    | boolean
    | number
    | string
    | Json[]
    | { [key: string]: Json };
  type Primitive = undefined | null | boolean | number | bigint | string;
}
