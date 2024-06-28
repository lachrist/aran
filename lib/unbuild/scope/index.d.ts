import type { RegularFrame } from "./variable-regular";
import type { ClosureFrame } from "./closure";
import type { EvalFrame } from "./variable-eval";
import type { ModeFrame } from "./mode";
import type { PrivateFrame } from "./private";
import type { RootFrame } from "./root";
import type { WithFrame } from "./variable-with";
import type { CatchFrame } from "./catch";
import type { IllegalFrame } from "./variable-illegal";

export { RootFrame } from "./root";

///////////
// Frame //
///////////

export type NodeFrame =
  | RegularFrame
  | ClosureFrame
  | CatchFrame
  | EvalFrame
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
