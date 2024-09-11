export type HarnessName = string & { __brand: "HarnessName" };

export type TargetPath = string & { __brand: "TargetPath" };

export type TargetName = string & { __brand: "TargetName" };

export type FetchHarness = (name: HarnessName) => Promise<string>;

export type FetchTarget = (base: TargetPath) => Promise<string>;

export type ResolveTarget = (name: TargetName, base: TargetPath) => TargetPath;

export type Fetch = {
  resolveTarget: ResolveTarget;
  fetchHarness: FetchHarness;
  fetchTarget: FetchTarget;
};
