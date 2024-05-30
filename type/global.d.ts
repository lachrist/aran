export {};

declare global {
  // type Primitive = undefined | null | boolean | number | string | bigint;
  type JsonPrimitive = null | boolean | number | string;
  type Json = JsonPrimitive | Json[] | { [key in string]?: Json };
}
