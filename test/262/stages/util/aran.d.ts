export { ResVariable as Variable } from "../../../../lib/weave/atom";

export type Location = Brand<string, "Location">;

export type Base = Brand<string, "Base">;

export type Advice = import("../../../../lib/weave/advice").Advice<Location>;

export type ObjectAdvice =
  import("../../../../lib/weave/advice").ObjectAdvice<Location>;

export type Pointcut =
  import("../../../../lib/weave/pointcut").Pointcut<Location>;

export type Config = import("../../../../lib/config").Config<Base, Location>;

export type Locate = import("../../../../lib/config").Locate<Base, Location>;
