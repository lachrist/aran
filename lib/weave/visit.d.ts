import type { Locate } from "../config.d.ts";
import type {
  ClosureKind,
  ProgramKind,
  BlockKind,
  Pointcut,
  LinkData,
} from "../../type/advice.d.ts";
import { OriginPath } from "../../type/weave.js";
import { Context, InternalLocalEvalContext } from "../context.js";
import { Header } from "../header.js";

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
      kind: Context["source"];
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
