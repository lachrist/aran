declare const __brand: unique symbol;

export type Brand<T, B> = T & { [__brand]: B };
