import type { StageName } from "../staging/stage-name";

export type Cursor = {
  stage: StageName;
  index: number;
};
