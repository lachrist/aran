import type { Node } from "./estree";
import type { Brand } from "./util";

export type StringHash = Brand<string, "Hash">;

export type NumberHash = Brand<number, "Hash">;

export type Hash = StringHash | NumberHash;

export type Digest = (node: Node) => Hash;
