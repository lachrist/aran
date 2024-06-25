export type Stage = "identity" | "parsing";

export type Cursor = {
  stage: Stage;
  index: number;
};
