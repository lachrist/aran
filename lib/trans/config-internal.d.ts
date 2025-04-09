import type { File, Config, Digest } from "./config.d.ts";
import type { FilePath, Hash } from "./hash.d.ts";

export type InternalFile = File<{ FilePath: FilePath }>;
export type InternalDigest = Digest<{ NodeHash: Hash; FilePath: FilePath }>;
export type InternalConfig = Config<{ NodeHash: Hash; FilePath: FilePath }>;
