declare const __brand: unique symbol;

export type Brand<T, B> = T & { [__brand]: B };

export type ValueOf<T> = T[keyof T];

export type JsonPrimitive = null | boolean | number | string;

export type Json = JsonPrimitive | Json[] | { [key in string]?: Json };
