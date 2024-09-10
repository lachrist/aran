import type { Deadzone } from "../deadzone";
import type { Hoisting } from "./hoist-public";

export type Annotation = {
  hoisting: Hoisting;
  deadzone: Deadzone;
};
