export type Stage = "identity" | "parsing" | "bare" | "full";

export type Cursor = {
  stage: Stage;
  argv: string[];
  index: number | null;
  target: string | null;
};
