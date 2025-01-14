import type { DependencyPath, HarnessName, MainPath } from "./fetch";

export type HarnessSource = {
  type: "harness";
  kind: "script";
  path: HarnessName;
  content: string;
};

export type MainSource = {
  type: "main";
  kind: "module" | "script";
  path: MainPath;
  content: string;
};

export type DependencySource = {
  type: "dependency";
  kind: "module";
  path: DependencyPath;
  content: string;
};

export type Source = HarnessSource | MainSource | DependencySource;
