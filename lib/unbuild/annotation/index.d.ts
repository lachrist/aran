import type { Hash } from "../../hash";
import type { Binding } from "./hoisting-public";

export type Annotation = {
  completion: { [key in Hash]?: null };
  hoisting: { [key in Hash]?: Binding[] };
};
