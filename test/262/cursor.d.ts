import type { TestPath } from "./fetch";
import type { StageName } from "./stagging/stage-name";

export type Cursor = {
  stage: StageName;
  index: number | null;
  path: TestPath | null;
};
