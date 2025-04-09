import type { Hash } from "../hash.d.ts";

export type SyntaxError = {
  message: string;
  origin: Hash;
};
