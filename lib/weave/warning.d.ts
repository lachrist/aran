import type { Path } from "../path";

export type Warning = {
  name: "MissingEvalAdvice";
  path: Path;
};
