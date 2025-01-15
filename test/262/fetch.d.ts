export type HarnessName = string & { __brand: "HarnessName" };

export type TestPath = string & { __brand: "TestPath" };

export type DependencyPath = string & { __brand: "DependencyPath" };

export type DependencyName = string & { __brand: "TargetName" };

export type FetchHarness = (name: HarnessName) => Promise<string>;

export type TargetPath = TestPath | DependencyPath;

export type FetchTarget = (path: TargetPath) => Promise<string>;

export type ResolveDependency = (
  name: DependencyName,
  base: TargetPath,
) => DependencyPath;

export type Fetch = {
  resolveDependency: ResolveDependency;
  fetchHarness: FetchHarness;
  fetchTarget: FetchTarget;
};
