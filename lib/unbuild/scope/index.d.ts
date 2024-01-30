import { RegularFrame } from "./variable-regular";
import { ClosureFrame } from "./closure";
import { EvalFrame } from "./variable-eval";
import { FakeFrame } from "./variable-fake";
import { ModeFrame } from "./mode";
import { PrivateFrame } from "./private";
import { RootFrame } from "./root";
import { WithFrame } from "./variable-with";
import { CatchFrame } from "./catch";
import { IllegalFrame } from "./variable-illegal";

export { RootFrame } from "./root";

///////////
// Frame //
///////////

export type NodeFrame =
  | RegularFrame
  | ClosureFrame
  | CatchFrame
  | EvalFrame
  | FakeFrame
  | IllegalFrame
  | ModeFrame
  | PrivateFrame
  | WithFrame;

export type Frame = RootFrame | NodeFrame;

///////////
// Scope //
///////////

export type NodeScope = {
  frame: NodeFrame;
  parent: Scope;
};

export type RootScope = {
  frame: RootFrame;
  parent: null;
};

export type Scope = NodeScope | RootScope;

export type PackScope = [RootFrame, ...NodeFrame[]];
