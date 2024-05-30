export type JsonPrimitive = null | boolean | number | string;

export type Json = JsonPrimitive | Json[] | { [key in string]?: Json };
