import type { Completion } from "./completion";
import type { Hoisting } from "./hoisting";

export type Annotation = {
  hoisting: Hoisting;
  completion: Completion;
};
