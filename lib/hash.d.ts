import type { Brand } from "./util";

export type FilePath = Brand<unknown, "FilePath">;

export type Hash = Brand<string | number, "Hash">;

export type HashProp = { _hash: Hash };
