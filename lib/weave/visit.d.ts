import type { Locate } from "../config.d.ts";
import type { ClosureKind, BlockKind, Pointcut } from "../../type/advice.d.ts";
import { OriginPath } from "../../type/weave.js";
import type { InternalLocalContext } from "../context.d.js";
import { Header } from "../header.js";
import { Program } from "../../type/aran.js";
import { Sort } from "../sort.js";

export type Options<B, L> = {
  evals: { [k in OriginPath]?: InternalLocalContext };
  base: B;
  pointcut: Pointcut<L>;
  locate: Locate<B, L>;
  advice: {
    kind: "object" | "function";
    variable: estree.Variable;
  };
};

export type Parent =
  | {
      type: "program";
      sort: Sort;
      head: Header[];
    }
  | {
      type: "closure";
      kind: ClosureKind;
      callee: weave.TargetPath;
    }
  | {
      type: "block";
      kind: BlockKind;
    };
