import type { File, Config, Digest } from "./config";
import type { FilePath, Hash } from "./hash";

export type InternalFile = File<FilePath>;
export type InternalDigest = Digest<Hash, FilePath>;
export type InternalConfig = Config<Hash, FilePath>;
