// @ts-nocheck

export type Value = Brand<unknown, "value">;

export type Location = Brand<string, "location">;

export type Hash = Brand<string, "hash">;

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

export type Point =
  | import("../../lib/weave/systematic/advice").Point<Value, Location>
  | {
      type: "apply.before";
      callee: Value;
      this: Value;
      arguments: Value[];
      location: Location;
    }
  | {
      type: "apply.after";
      value: Value;
      location: Location;
    }
  | {
      type: "construct.before";
      callee: Value;
      arguments: Value[];
      location: Location;
    }
  | {
      type: "construct.after";
      value: Value;
      location: Location;
    };
