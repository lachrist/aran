import type { Program } from "../estree";
import type { Path } from "../path";

export type Completion = {
  type: "program";
  record: { [key in Path]?: null };
  root: Program;
};
