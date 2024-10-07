import type { Completion } from "./completion";
import type { Deadzone } from "./deadzone";
import type { Hoisting } from "./hoisting-public";

export type Annotation = {
  hoisting: Hoisting;
  deadzone: Deadzone;
  completion: Completion;
};
