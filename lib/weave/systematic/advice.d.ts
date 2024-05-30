import { DeepLocalContext } from "../../program";
import { Variable as EstreeVariable } from "../../estree";
import {
  ArgVariable as Variable,
  ArgNode as Node,
  ArgProgram as Program,
  ArgControlBlock as ControlBlock,
  ArgRoutineBlock as RoutineBlock,
  ArgStatement as Statement,
  ArgEffect as Effect,
  ArgExpression as Expression,
} from "../atom";
import { Parameter } from "../../lang";
import { Json } from "../../json";

export {
  Variable,
  Node,
  Program,
  ControlBlock,
  RoutineBlock,
  Statement,
  Effect,
  Expression,
};

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
        frame: { [K in Variable | Parameter]: V },
        ...point: P
      ) => void;
    }
  | {
      kind: "block@overframe";
      pointcut: Pointcut<P, ControlBlock | RoutineBlock>;
      behavior: (
        state: X,
        frame: { [K in Variable | Parameter]: V },
        ...point: P
      ) => { [K in Variable | Parameter]: V };
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

export type EmptyAspect = [EstreeVariable, EmptyAdvice][];
