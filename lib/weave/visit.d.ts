import type { Base, Locate } from "../../type/options.d.ts";
import type {
  ClosureKind,
  ProgramKind,
  BlockKind,
  Pointcut,
  LinkData,
} from "../../type/advice.d.ts";

export type Options<L> = {
  base: Base;
  pointcut: Pointcut<L>;
  locate: Locate<L>;
  advice: {
    kind: "object" | "function";
    variable: estree.Variable;
  };
};

export type Parent =
  | {
      type: "program";
      kind: ProgramKind;
      links: LinkData[];
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
