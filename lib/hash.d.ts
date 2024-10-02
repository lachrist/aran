import type { Brand } from "./util";

export type Hash = Brand<string | number, "Hash">;

export type HashProp = { _hash: Hash };
