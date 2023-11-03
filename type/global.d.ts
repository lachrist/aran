export {};

declare const __brand: unique symbol;

declare global {
  type Primitive = undefined | null | boolean | number | bigint | string;
  type Json =
    | null
    | boolean
    | number
    | string
    | Json[]
    | { [key: string]: Json };
  type Brand<T, B> = T & { [__brand]: B };
  type __location = Brand<string, "__location">;
  type __unique = Brand<string, "__unique">;
}
