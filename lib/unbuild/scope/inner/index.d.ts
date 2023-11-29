import type { DynamicFrame } from "./dynamic.d.ts";
import type { FakeFrame } from "./fake.d.ts";
import type { StaticFrame } from "./static/index.d.ts";

export type Scope =
  | { type: "root" }
  | { type: "static"; frame: StaticFrame; parent: Scope }
  | { type: "dynamic"; frame: DynamicFrame; parent: Scope }
  | {
      type: "fake";
      frame: FakeFrame;
      parent: Scope;
    };
