import type { Locate } from "../config.d.ts";
import type { ClosureKind, BlockKind, Pointcut } from "../../type/advice.d.ts";
import type { OriginPath } from "../../type/weave.d.ts";
import type { InternalLocalContext } from "../context.d.ts";
import type { Header } from "../header.d.ts";
import type { Sort } from "../sort.d.ts";

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
    }
  | {
      type: "block";
      kind: BlockKind;
    };
