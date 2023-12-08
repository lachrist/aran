export type Progress = {
  stage: "identity" | "parsing" | "empty-enclave";
  index: number;
  target: string | null;
};
