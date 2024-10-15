import type { Hash } from "../../hash";
import type { Completion } from "./completion";
import type { Hoisting } from "./hoisting";

export type Annotation = {
  hoisting: Hoisting;
  completion: Completion;
  voidling: { [key in Hash]?: null };
};
