import type { MainPath } from "./fetch";
import type { StageName } from "./stage";

export type Cursor = {
  stage: StageName;
  index: number | null;
  path: MainPath | null;
};
