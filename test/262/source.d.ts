import type { HarnessName, TargetPath } from "./fetch";

export type HarnessSource = {
  kind: "harness";
  path: HarnessName;
  content: string;
  context: null;
};

export type GlobalSource = {
  kind: "script" | "module" | "eval";
  path: TargetPath | null;
  content: string;
  context: null;
};

export type LocalSource = {
  kind: "eval";
  path: null;
  content: string;
  context: object;
};

export type Source = HarnessSource | GlobalSource | LocalSource;

export type RootSource = {
  kind: "script" | "module";
  path: TargetPath;
  content: string;
  context: null;
};
