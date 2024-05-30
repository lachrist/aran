// @ts-nocheck

export type Value = Brand<unknown, "value">;

export type Location = Brand<string, "location">;

export type Hash = Brand<string, "hash">;

export type Point = import("../../lib/weave/systematic/advice").Point<
  Value,
  Location
>;

export type Advice = import("../../lib/weave/systematic/advice").Advice<
  Value,
  Location
>;

export type Label = import("../../lib/weave/systematic/advice").Label;

export type Link = import("../../lib/weave/systematic/advice").LinkData;

export type Variable = import("../../lib/weave/systematic/advice").Variable;

export type EstreeVariable = import("../../type/estree").Variable;

export type Environment = {
  [key in Variable]?: Value;
};

export type Item =
  | {
      type: "frame";
      point: Point & {
        type: "program.enter" | "closure.enter" | "block.enter";
      };
    }
  | {
      type: "value";
      point:
        | {
            type: "apply.after";
            value: Value;
            location: Location;
          }
        | {
            type: "construct.after";
            value: Value;
            location: Location;
          }
        | (Point & {
            type:
              | "read.after"
              | "primitive.after"
              | "intrinsic.after"
              | "function.after"
              | "arrow.after"
              | "eval.after"
              | "conditional.after"
              | "global.read.after"
              | "global.typeof.after";
          });
    }
  | {
      type: "match";
      point:
        | {
            type: "apply.before";
            callee: Value;
            this: Value;
            arguments: Value[];
            location: Location;
          }
        | {
            type: "construct.before";
            callee: Value;
            arguments: Value[];
            location: Location;
          }
        | (Point & {
            type:
              | "apply.before"
              | "construct.before"
              | "eval.before"
              | "conditional.before"
              | "debugger.before"
              | "branch.before"
              | "global.read.before"
              | "global.typeof.before"
              | "global.write.before"
              | "global.declare.before";
          });
    };

export type State = {
  callstack: Item[][];
  jumps: WeakMap<Location, Item[][]>;
  closures: WeakMap<Function, Item[]>;
};

// /**
//  * @typedef {{
//  *   type: "frame",
//  *   point: Point & {
//  *     type:
//  *       | "program.enter"
//  *       | "closure.enter"
//  *       | "block.enter",
//  *   },
//  * } | {
//  *   type: "value",
//  *   point: {
//  *     type: "apply.after",
//  *     value: Value,
//  *     location: Location,
//  *   } | {
//  *     type: "construct.after",
//  *     value: Value,
//  *     location: Location,
//  *   } | (Point & {
//  *     type:
//  *       | "read.after"
//  *       | "primitive.after"
//  *       | "intrinsic.after"
//  *       | "function.after"
//  *       | "arrow.after"
//  *       | "eval.after"
//  *       | "conditional.after"
//  *       | "global.read.after"
//  *       | "global.typeof.after",
//  *   }),
//  * } | {
//  *   type: "match",
//  *   point: {
//  *     type: "apply.before",
//  *     callee: Value,
//  *     this: Value,
//  *     arguments: Value[],
//  *     location: Location,
//  *   } | {
//  *     type: "construct.before",
//  *     callee: Value,
//  *     arguments: Value[],
//  *     location: Location,
//  *   } | (Point & {
//  *     type:
//  *       | "apply.before"
//  *       | "construct.before"
//  *       | "eval.before"
//  *       | "conditional.before"
//  *       | "debugger.before"
//  *       | "branch.before"
//  *       | "global.read.before"
//  *       | "global.typeof.before"
//  *       | "global.write.before"
//  *       | "global.declare.before",
//  *   }),
//  * }} Item
//  */
