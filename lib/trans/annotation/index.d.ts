import type { Completion } from "./completion.d.ts";
import type { Hoisting } from "./hoisting.d.ts";

export type Annotation = {
  hoisting: Hoisting;
  completion: Completion;
};
