import type { Annotation } from "./annotation";
import type { Expression, Label } from "./atom";
import type { Scope } from "./scope";

export type Context = {
  scope: Scope;
  annotation: Annotation;
};

export type StatementContext = Context & {
  origin: "closure" | "program";
  labels: Label[];
  loop: {
    break: null | Label;
    continue: null | Label;
  };
};

export type PatterContext = Context & {
  kind: "var" | "let" | "const" | null;
  right: Expression;
};
