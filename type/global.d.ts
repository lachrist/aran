export {};

declare const __brand: unique symbol;

declare global {
  type Brand<T, B> = T & { [__brand]: B };

  type List<X> = { car: X; cdr: List<X> } | null;

  type Json =
    | null
    | boolean
    | number
    | string
    | Json[]
    | { [key: string]: Json };

  type Primitive = undefined | null | boolean | number | bigint | string;
}