import type { Digest, Hash } from "../../hash";
import type { Hoisting } from "./hoisting-public";

export type Annotation = {
  digest: Digest;
  completion: { [key in Hash]?: null };
  hoisting: Hoisting;
};
