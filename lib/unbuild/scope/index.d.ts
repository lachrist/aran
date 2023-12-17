import { DynamicFrame } from "./dynamic";
import { ClosureFrame } from "./closure";
import { PrivateFrame } from "./private";
import { RootFrame } from "./root";
import { StaticFrame } from "./static";

export type Frame =
  | RootFrame
  | StaticFrame
  | DynamicFrame
  | ClosureFrame
  | PrivateFrame;

export type RootScope = {
  frame: RootFrame;
  parent: null;
};

export type StaticScope = {
  frame: StaticFrame;
  parent: Scope;
};

export type DynamicScope = {
  frame: DynamicFrame;
  parent: Scope;
};

export type ParamScope = {
  frame: ClosureFrame;
  parent: Scope;
};

export type PrivateScope = {
  frame: PrivateFrame;
  parent: Scope;
};

export type Scope =
  | RootScope
  | StaticScope
  | DynamicScope
  | ParamScope
  | PrivateScope;
