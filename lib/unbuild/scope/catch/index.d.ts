import type { Mode } from "../../mode";

export type CatchScope = { catch: "parent" | "orphan" };

export type ReadErrorOperation = {
  type: "read-error";
  mode: Mode;
};
