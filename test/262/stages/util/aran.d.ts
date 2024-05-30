// import { ObjectAdvice } from "../../../../type/advice";

export type Base = Brand<string, "Base">;

export type Location = Brand<string, "Location">;

export type Source = Brand<string, "Source">;

export type Variable = Brand<string, "Variable">;

export type Specifier = Brand<string, "Specifier">;

export type PrivateKey = Brand<string, "PrivateKey">;

export type Label = Brand<string, "Label">;

export type Locate = import("../../../../lib/config").Locate<Base, Location>;

export type Config = import("../../../../lib/config").Config<Base, Location>;

export type ObjectAdvice<
  P extends {
    ScopeValue: unknown;
    StackValue: unknown;
    FrontierValue: unknown;
  },
> = import("../../../../lib/weave/systematic/advice").ObjectAdvice<{
  Label: Label;
  Location: Location;
  Variable: Variable;
  Specifier: Specifier;
  Source: Source;
  PrivateKey: PrivateKey;
  StackValue: P["StackValue"];
  ScopeValue: P["ScopeValue"];
  FrontierValue: P["FrontierValue"];
}>;

export type FunctionAdvice<V> =
  import("../../../../lib/weave/systematic/advice").FunctionAdvice<V, Location>;

export type Frame<
  P extends {
    ScopeValue: unknown;
    StackValue: unknown;
    FrontierValue: unknown;
  },
> = import("../../../../lib/weave/systematic/advice").Frame<{
  Label: Label;
  Location: Location;
  Variable: Variable;
  Specifier: Specifier;
  Source: Source;
  PrivateKey: PrivateKey;
  StackValue: P["StackValue"];
  ScopeValue: P["ScopeValue"];
  FrontierValue: P["FrontierValue"];
}>;
