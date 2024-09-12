import type { HarnessName, TargetPath } from "./fetch";

export type HarnessSource = {
  type: "harness";
  kind: "script";
  path: HarnessName;
  content: string;
  context: null;
};

export type MainSource = {
  type: "main";
  kind: "module" | "script";
  path: TargetPath;
  content: string;
  context: null;
};

export type DependencySource = {
  type: "dependency";
  kind: "module";
  path: TargetPath;
  content: string;
  context: null;
};

export type GlobalSource = {
  type: "global";
  kind: "script" | "eval";
  path: null;
  content: string;
  context: null;
};

export type LocalSource = {
  type: "local";
  kind: "eval";
  path: null;
  content: string;
  context: object;
};

export type Source =
  | HarnessSource
  | MainSource
  | DependencySource
  | GlobalSource
  | LocalSource;
