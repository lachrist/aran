import type { File, Config, Digest } from "./config";
import type { FilePath, Hash } from "./hash";

export type InternalFile = File<{ FilePath: FilePath }>;
export type InternalDigest = Digest<{ NodeHash: Hash; FilePath: FilePath }>;
export type InternalConfig = Config<{ NodeHash: Hash; FilePath: FilePath }>;
