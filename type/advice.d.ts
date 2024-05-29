import { DeepLocalContext } from "../lib/program";
import { ArgAtom } from "../lib/weave/atom";
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

export type Path = Brand<string, "Path">;

// TODO: figure out which atom to use

// export type Atom = BrandAtom<Path>;

export type Atom = ArgAtom;

export type Node = GenericNode<Atom>;

export type Program = GenericProgram<Atom>;

export type ControlBlock = GenericControlBlock<Atom>;

export type RoutineBlock = GenericRoutineBlock<Atom>;

export type Statement = GenericStatement<Atom>;

export type Effect = GenericEffect<Atom>;

export type Expression = GenericExpression<Atom>;

export type Pointcut<P extends Json[], N extends Node> = (
  node: N,
  parent: Node,
  root: Program,
) => undefined | null | P;

export type Advice<V, X, P extends Json[]> =
  | {
      kind: "block@setup";
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
      ) => void;
    }
  | {
      kind: "block@overframe";
      pointcut: Pointcut<P, ControlBlock | RoutineBlock>;
      behavior: (
        state: X,
        frame: { [K in Atom["Variable"] | Parameter]: V },
        ...point: P
      ) => { [K in Atom["Variable"] | Parameter]: V };
    }
  | {
      kind: "block@before" | "block@after" | "block@teardown";
      pointcut: Pointcut<P, ControlBlock | RoutineBlock>;
      behavior: (state: X, ...point: P) => void;
    }
  | {
      kind: "block@failure";
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
        | "block@setup"
        | "block@frame"
        | "block@overframe"
        | "block@before"
        | "block@after"
        | "block@failure"
        | "block@teardown";
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
