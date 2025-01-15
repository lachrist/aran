import type { TestPath } from "./fetch";
import type { StageName } from "./stage";

export type Cursor = {
  stage: StageName;
  index: number | null;
  path: TestPath | null;
};
