export { Variable } from "../../../../type/advice";

export type Location = Brand<string, "Location">;

export type Base = Brand<string, "Base">;

export type Advice = import("../../../../type/advice").Advice<Location>;

export type ObjectAdvice =
  import("../../../../type/advice").ObjectAdvice<Location>;

export type Pointcut = import("../../../../type/advice").Pointcut<Location>;

export type Config = import("../../../../lib/config").Config<Base, Location>;

export type Locate = import("../../../../lib/config").Locate<Base, Location>;
