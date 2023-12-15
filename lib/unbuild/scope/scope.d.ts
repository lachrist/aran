import { DynamicFrame } from "./dynamic";
import { ParamFrame } from "./param";
import { PrivateFrame } from "./private";
import { FinalFrame } from "./final";
import { StaticFrame } from "./static";

export type NodeFrame =
  | {
      type: "static";
      frame: StaticFrame;
    }
  | {
      type: "dynamic";
      frame: DynamicFrame;
    }
  | {
      type: "param";
      frame: ParamFrame;
    }
  | {
      type: "private";
      frame: PrivateFrame;
    };

export type RootFrame = {
  type: "root";
  frame: FinalFrame;
};

export type Frame = RootFrame | NodeFrame;

export type RootScope = {
  type: "root";
  frame: RootFrame;
  parent: null;
};

export type NodeScope = {
  type: "node";
  frame: NodeFrame;
  parent: Scope;
};

export type Scope = RootScope | NodeScope;
