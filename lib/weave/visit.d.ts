import type { Locate } from "../config.d.ts";
import type { ClosureKind, BlockKind, Pointcut } from "../../type/advice.d.ts";
import { OriginPath } from "../../type/weave.js";
import { InternalLocalEvalContext } from "../context.js";
import { Header } from "../header.js";
import { Program } from "../../type/aran.js";

export type Options<B, L> = {
  evals: Record<OriginPath, InternalLocalEvalContext>;
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
      kind: Program<weave.ArgAtom>["kind"];
      mode: Program<weave.ArgAtom>["mode"];
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
