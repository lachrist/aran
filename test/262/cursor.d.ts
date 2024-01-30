export type Cursor = {
  stage: "identity" | "parsing" | "empty-enclave";
  index: number;
  target: string | null;
};
