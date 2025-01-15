import type { TestPath } from "../fetch";
import type { StageName } from "../staging/stage-name";

export type Cursor = {
  stage: StageName;
  index: number | null;
  path: TestPath | null;
};
