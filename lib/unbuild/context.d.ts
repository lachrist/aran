import type { Annotation } from "./annotation";
import type { Scope } from "./scope";

export type RootContext = {
  mode: "strict" | "sloppy";
  scope: Scope | null;
  annotation: Annotation;
  parent: "program";
};

export type Context = {
  mode: "strict" | "sloppy";
  scope: Scope;
  annotation: Annotation;
  parent:
    | "arrow"
    | "function"
    | "method"
    | "constructor"
    | "program"
    | "static-block";
};
