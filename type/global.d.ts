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
    | { [key in string]?: Json };
  type Brand<T, B> = T & { [__brand]: B };
}
