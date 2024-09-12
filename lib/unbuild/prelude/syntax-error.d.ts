import type { Path } from "../../path";

export type SyntaxError = {
  message: string;
  origin: Path;
};
