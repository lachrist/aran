export type Stage =
  | "identity"
  | "parsing"
  | "empty-standard-native"
  | "empty-standard-emulate"
  | "transparent-standard-native"
  | "transparent-standard-emulate";

export type Cursor = {
  stage: Stage;
  index: number;
};
