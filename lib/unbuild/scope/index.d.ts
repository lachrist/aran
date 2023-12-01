import type { DynamicFrame } from "./dynamic.js";
import type { FakeFrame } from "./fake.js";
import type { StaticFrame } from "./static/index.js";

export type Scope =
  | { type: "root" }
  | { type: "static"; frame: StaticFrame; parent: Scope }
  | { type: "dynamic"; frame: DynamicFrame; parent: Scope }
  | {
      type: "fake";
      frame: FakeFrame;
      parent: Scope;
    };
