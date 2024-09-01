export type Stage =
  | "identity"
  | "bare-basic-standard"
  | "bare-basic-flexible"
  | "bare-patch-flexible"
  | "bare-patch-standard"
  | "bare-weave-flexible"
  | "bare-weave-standard"
  | "state-basic-standard";

export type Cursor = {
  stage: Stage;
  index: number | null;
  target: string | null;
};
