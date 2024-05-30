import { Brand } from "./brand";

export type Path = Brand<string, "Path">;

export type Segment =
  | number
  | "cases"
  | "discriminant"
  | "update"
  | "key"
  | "value"
  | "properties"
  | "elements"
  | "id"
  | "params"
  | "callee"
  | "arguments"
  | "test"
  | "init"
  | "declarations"
  | "finalizer"
  | "expressions"
  | "source"
  | "expression"
  | "handler"
  | "consequent"
  | "alternate"
  | "declaration"
  | "superClass"
  | "object"
  | "tag"
  | "property"
  | "argument"
  | "left"
  | "param"
  | "right"
  | "block"
  | "body"
  | "quasi"
  | "quasis";
