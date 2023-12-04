export type Value = Brand<unknown, "value">;

export type Location = Brand<string, "location">;

export type Hash = Brand<string, "hash">;

export type Advice = import("../../type/advice").Advice<Value, Location>;

export type Label = import("../../type/advice").Label;

export type Link = import("../../type/advice").LinkData;

export type Variable = import("../../type/advice").Variable;

export type EstreeVariable = import("../../type/estree").Variable;

export type Environment = {
  [key in Variable]?: Value;
};

export type Point =
  | import("../../type/advice").Point<Value, Location>
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
