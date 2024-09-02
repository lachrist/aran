import type { StageName } from "./stage";

export type Cursor = {
  stage: StageName;
  index: number | null;
  target: string | null;
};
