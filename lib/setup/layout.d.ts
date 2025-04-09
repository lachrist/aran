import type { Expression, Statement } from "estree-sentry";
import type { Intrinsic } from "../lang/syntax";
import type { Tree } from "../util/tree";

export type Dependency =
  | "Boolean"
  | "Reflect_apply"
  | "Reflect_getOwnPropertyDescriptor"
  | "Reflect_defineProperty"
  | "Reflect_ownKeys"
  | "Reflect_construct"
  | "Reflect_getPrototypeOf"
  | "SyntaxError"
  | "Object_hasOwn"
  | "Array_prototype_values"
  | "eval"
  | "Symbol"
  | "Symbol_iterator"
  | "Symbol_toStringTag"
  | "Function_prototype";

export type Layout = {
  name: Intrinsic;
  dependencies: Tree<Dependency>;
  setup: Tree<Statement<{}>>;
  value: Expression<{}>;
};
