export {};

declare const __brand: unique symbol;

declare global {
  type Primitive = undefined | null | boolean | number | string | bigint;
  type JsonPrimitive = null | boolean | number | string;
  type Json = JsonPrimitive | Json[] | { [key in string]?: Json };
  type Brand<T, B> = T & { [__brand]: B };
}
