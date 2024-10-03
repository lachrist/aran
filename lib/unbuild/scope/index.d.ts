import type { RegularFrame } from "./variable-regular";
import type { RoutineFrame } from "./routine";
import type { EvalFrame } from "./variable-eval";
import type { PrivateFrame } from "./private";
import type { RootFrame } from "./root";
import type { FakeFrame } from "./variable-fake";
import type { WithFrame } from "./variable-with";
import type { CatchFrame } from "./catch";
import type { IllegalFrame } from "./variable-illegal";

export type NodeFrame =
  | RegularFrame
  | RoutineFrame
  | CatchFrame
  | EvalFrame
  | IllegalFrame
  | FakeFrame
  | PrivateFrame
  | WithFrame;

export type Frame = RootFrame | NodeFrame;

///////////
// Frame //
///////////

export type PackScope = [RootFrame, ...NodeFrame[]];

///////////
// Scope //
///////////

export type RootScope = {
  here: RootFrame;
  next: null;
};

export type NodeScope = {
  here: NodeFrame;
  next: Scope;
};

export type Scope = NodeScope | RootScope;
