import { DeepLocalContext } from "../lib/program";
import {
  ControlBlock as GenericControlBlock,
  RoutineBlock as GenericRoutineBlock,
  Effect as GenericEffect,
  Expression as GenericExpression,
  Node as GenericNode,
  Program as GenericProgram,
  Statement as GenericStatement,
  Parameter,
  BrandAtom,
} from "./aran";

export type OriginPath = Brand<string, "OriginPath">;

export type TargetPath = Brand<string, "TargetPath">;

export type Atom = BrandAtom<OriginPath>;

export type Node = GenericNode<Atom>;

export type Program = GenericProgram<Atom>;

export type ControlBlock = GenericControlBlock<Atom>;

export type RoutineBlock = GenericRoutineBlock<Atom>;

export type Statement = GenericStatement<Atom>;

export type Effect = GenericEffect<Atom>;

export type Expression = GenericExpression<Atom>;

export type Pointcut<P extends Json[], N extends Node> = (
  path: TargetPath,
  node: N,
  parent: Node,
  root: Program,
) => null | P;

export type Advice<V, X, P extends Json[]> =
  | {
      kind: "block@initialize";
      pointcut: Pointcut<P, ControlBlock | RoutineBlock>;
      behavior: (parent: X, ...point: P) => X;
    }
  | {
      kind: "block@frame";
      pointcut: Pointcut<P, ControlBlock | RoutineBlock>;
      behavior: (
        state: X,
        frame: { [K in Atom["Variable"] | Parameter]: V },
        ...point: P
      ) => undefined | null | { [K in Atom["Variable"] | Parameter]: V };
    }
  | {
      kind: "block@before" | "block@after" | "block@finally";
      pointcut: Pointcut<P, ControlBlock | RoutineBlock>;
      behavior: (state: X, ...point: P) => void;
    }
  | {
      kind: "block@catch";
      pointcut: Pointcut<P, ControlBlock | RoutineBlock>;
      behavior: (state: X, error: V, ...point: P) => V;
    }
  | {
      kind: "statement@before" | "statement@after";
      pointcut: Pointcut<P, Statement>;
      behavior: (state: X, ...point: P) => void;
    }
  | {
      kind: "effect@before" | "effect@after";
      pointcut: Pointcut<P, Effect>;
      behavior: (state: X, ...point: P) => void;
    }
  | {
      kind: "expression@before";
      pointcut: Pointcut<P, Expression>;
      behavior: (state: X, ...point: P) => void;
    }
  | {
      kind: "expression@after";
      pointcut: Pointcut<P, Expression>;
      behavior: (state: X, result: V, ...point: P) => V;
    }
  | {
      kind: "eval@before";
      pointcut: Pointcut<P, Expression & { type: "EvalExpression" }>;
      behavior: (
        state: X,
        code: V,
        context: DeepLocalContext,
        ...point: P
      ) => V;
    }
  | {
      kind: "apply@around";
      pointcut: Pointcut<P, Expression & { type: "ApplyExpression" }>;
      behavior: (
        state: X,
        callee: V,
        this_: V,
        arguments_: V[],
        ...point: P
      ) => V;
    }
  | {
      kind: "construct@around";
      pointcut: Pointcut<P, Expression & { type: "ConstructExpression" }>;
      behavior: (state: X, callee: V, arguments_: V[], ...point: P) => V;
    };

export type EmptyAdvice =
  | {
      kind:
        | "block@initialize"
        | "block@frame"
        | "block@before"
        | "block@after"
        | "block@catch"
        | "block@finally";
      pointcut: Pointcut<Json[], ControlBlock | RoutineBlock>;
    }
  | {
      kind: "statement@before" | "statement@after";
      pointcut: Pointcut<Json[], Statement>;
    }
  | {
      kind: "effect@before" | "effect@after";
      pointcut: Pointcut<Json[], Effect>;
    }
  | {
      kind: "expression@before" | "expression@after";
      pointcut: Pointcut<Json[], Expression>;
    }
  | {
      kind: "eval@before";
      pointcut: Pointcut<Json[], Expression & { type: "EvalExpression" }>;
    }
  | {
      kind: "apply@around";
      pointcut: Pointcut<Json[], Expression & { type: "ApplyExpression" }>;
    }
  | {
      kind: "construct@around";
      pointcut: Pointcut<Json[], Expression & { type: "ConstructExpression" }>;
    };

export type EmptyAspect = [estree.Variable, EmptyAdvice][];

// export type EmptyAspect<X extends Json> = {
//   initial: X;
//   advices: [estree.Variable, EmptyAdvice][];
// };

// export type Advice<V, X, P extends Json[]> =
//   | {
//       kind: "block@initialize";
//       stateful: true;
//       pointcut: BlockPointcut<P>;
//       behavior: (parent: X, ...point: P) => X;
//     }
//   | {
//       kind: "block@initialize";
//       stateful: false;
//       pointcut: BlockPointcut<P>;
//       behavior: (...point: P) => X;
//     }
//   | {
//       kind: "block@frame";
//       stateful: true;
//       pointcut: BlockPointcut<P>;
//       behavior: (
//         state: X,
//         frame: { [K in Atom["Variable"] | Parameter]: V },
//         ...point: P
//       ) => null | { [K in Atom["Variable"] | Parameter]: V };
//     }
//   | {
//       kind: "block@frame";
//       stateful: false;
//       pointcut: BlockPointcut<P>;
//       behavior: (
//         frame: { [K in Atom["Variable"] | Parameter]: V },
//         ...point: P
//       ) => null | { [K in Atom["Variable"] | Parameter]: V };
//     }
//   | {
//       kind: "block@before" | "block@after" | "block@finally";
//       stateful: true;
//       pointcut: BlockPointcut<P>;
//       behavior: (state: X, ...point: P) => void;
//     }
//   | {
//       kind: "block@before" | "block@after" | "block@finally";
//       stateful: false;
//       pointcut: BlockPointcut<P>;
//       behavior: (...point: P) => void;
//     }
//   | {
//       kind: "block@catch";
//       stateful: true;
//       pointcut: BlockPointcut<P>;
//       behavior: (state: X, error: V, ...point: P) => V;
//     }
//   | {
//       kind: "block@catch";
//       stateful: false;
//       pointcut: BlockPointcut<P>;
//       behavior: (error: V, ...point: P) => V;
//     }
//   | {
//       kind: "statement@before" | "statement@after";
//       stateful: true;
//       pointcut: StatementPointcut<P>;
//       behavior: (state: X, ...point: P) => void;
//     }
//   | {
//       kind: "statement@before" | "statement@after";
//       stateful: false;
//       pointcut: StatementPointcut<P>;
//       behavior: (...point: P) => void;
//     }
//   | {
//       kind: "effect@before" | "effect@after";
//       stateful: true;
//       pointcut: EffectPointcut<P>;
//       behavior: (state: X, ...point: P) => void;
//     }
//   | {
//       kind: "effect@before" | "effect@after";
//       stateful: false;
//       pointcut: EffectPointcut<P>;
//       behavior: (...point: P) => void;
//     }
//   | {
//       kind: "expression@before";
//       stateful: true;
//       pointcut: ExpressionPointcut<P>;
//       behavior: (state: X, ...point: P) => void;
//     }
//   | {
//       kind: "expression@before";
//       stateful: false;
//       pointcut: ExpressionPointcut<P>;
//       behavior: (...point: P) => void;
//     }
//   | {
//       kind: "expression@after";
//       stateful: true;
//       pointcut: ExpressionPointcut<P>;
//       behavior: (state: X, result: V, ...point: P) => V;
//     }
//   | {
//       kind: "expression@after";
//       stateful: false;
//       pointcut: ExpressionPointcut<P>;
//       behavior: (result: V, ...point: P) => V;
//     }
//   | {
//       kind: "eval@before";
//       stateful: true;
//       pointcut: EvalExpressionPointcut<P>;
//       behavior: (
//         state: X,
//         code: V,
//         context: DeepLocalContext,
//         ...point: P
//       ) => V;
//     }
//   | {
//       kind: "apply@around";
//       stateful: true;
//       pointcut: ApplyExpressionPointcut<P>;
//       behavior: (
//         state: X,
//         callee: V,
//         this_: V,
//         arguments_: V[],
//         ...point: P
//       ) => V;
//     }
//   | {
//       kind: "apply@around";
//       stateful: false;
//       pointcut: ApplyExpressionPointcut<P>;
//       behavior: (callee: V, this_: V, arguments_: V[], ...point: P) => V;
//     }
//   | {
//       kind: "construct@around";
//       stateful: true;
//       pointcut: ConstructExpressionPointcut<P>;
//       behavior: (state: X, callee: V, arguments_: V[], ...point: P) => V;
//     }
//   | {
//       kind: "construct@around";
//       stateful: false;
//       pointcut: ConstructExpressionPointcut<P>;
//       behavior: (callee: V, arguments_: V[], ...point: P) => V;
//     };

// export type EmptyAdvice =
//   | {
//       kind: "block@before" | "block@after" | "block@catch" | "block@failure";
//       stateful: boolean;
//       pointcut: BlockPointcut<Json[]>;
//     }
//   | {
//       kind: "statement@before" | "statement@after";
//       stateful: boolean;
//       pointcut: StatementPointcut<Json[]>;
//     }
//   | {
//       kind: "effect@before" | "effect@after";
//       stateful: boolean;
//       pointcut: EffectPointcut<Json[]>;
//     }
//   | {
//       kind: "expression@before" | "expression@after";
//       stateful: boolean;
//       pointcut: ExpressionPointcut<Json[]>;
//     }
//   | {
//       kind: "eval@before";
//       stateful: boolean;
//       pointcut: EvalExpressionPointcut<Json[]>;
//     }
//   | {
//       kind: "apply@around";
//       stateful: boolean;
//       pointcut: ApplyExpressionPointcut<Json[]>;
//     }
//   | {
//       kind: "construct@around";
//       stateful: boolean;
//       pointcut: ConstructExpressionPointcut<Json[]>;
//     };
