import { TargetPath } from "./fetch";
import type { StageName } from "./stage";

export type Cursor = {
  stage: StageName;
  index: number | null;
  path: TargetPath | null;
};
