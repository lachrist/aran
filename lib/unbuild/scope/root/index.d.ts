import { ExternalRootContext, InternalRootContext } from "../../../context";
import { WritableCache } from "../../cache";

export type Declare = {
  type: "declare";
  mode: "strict" | "sloppy";
  kind: "var" | "let" | "const";
  variable: estree.Variable;
};

export type VarBinding = {
  kind: "var";
  deadzone: null;
};

export type FunctionBinding = {
  kind: "function";
  deadzone: null;
};

export type LifespanBinding = VarBinding | FunctionBinding;

export type LetBinding<Z> = {
  kind: "let";
  deadzone: Z;
};

export type ConstBinding<Z> = {
  kind: "const";
  deadzone: Z;
};

export type ClassBinding<Z> = {
  kind: "class";
  deadzone: Z;
};

export type DeadzoneBinding<Z> =
  | LetBinding<Z>
  | ConstBinding<Z>
  | ClassBinding<Z>;

export type ReifyBinding = LifespanBinding | DeadzoneBinding<null>;

export type AlienBinding = LifespanBinding | DeadzoneBinding<WritableCache>;

export type ReifyRootFrame = {
  type: "root-reify";
  context: InternalRootContext;
  record: {
    [k in estree.Variable]?: ReifyBinding;
  };
};

export type AlienRootFrame = {
  type: "root-alien";
  context: ExternalRootContext;
  record: {
    [k in estree.Variable]?: AlienBinding;
  };
};

export type RootFrame = ReifyRootFrame | AlienRootFrame;
