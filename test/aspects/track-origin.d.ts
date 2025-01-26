import { Atom, ClosureKind, Intrinsic, Parameter, SyntaxPrimitive } from "aran";

export type AspectKind =
  | "block@setup"
  | "block@declaration"
  | "program-block@after"
  | "closure-block@after"
  | "apply@around"
  | "construct@around"
  | "primitive@after"
  | "intrinsic@after"
  | "import@after"
  | "read@after"
  | "closure@after"
  | "test@before"
  | "write@before"
  | "export@before"
  | "drop@before"
  | "eval@before"
  | "eval@after"
  | "await@before"
  | "await@after"
  | "yield@before"
  | "yield@after";

export type Identifier<atom extends Atom> = atom["Variable"] | Parameter;

export type Transit<atom extends Atom> =
  | { type: "void" }
  | {
      type: "apply";
      source: {
        function: Value;
        this: Value;
        arguments: Value[];
      };
      shadow: {
        function: ShadowValue<atom>;
        this: ShadowValue<atom>;
        arguments: ShadowValue<atom>[];
      };
    }
  | {
      type: "construct";
      source: {
        function: Value;
        arguments: Value[];
      };
      shadow: {
        function: ShadowValue<atom>;
        arguments: ShadowValue<atom>[];
      };
    }
  | {
      type: "return";
      source: Value;
      shadow: ShadowValue<atom>;
    };

export type ShadowValue<atom extends Atom> =
  | {
      type: "arguments";
      values: ShadowValue<atom>[];
      location: atom["Tag"];
    }
  | {
      type: "primitive";
      value: SyntaxPrimitive;
      location: atom["Tag"];
    }
  | {
      type: "closure";
      kind: ClosureKind;
      location: atom["Tag"];
    }
  | {
      type: "intrinsic";
      name: Intrinsic;
      location: atom["Tag"];
    }
  | {
      type: "initial";
      identifier: Identifier<atom>;
      location: Atom["Tag"];
    }
  | {
      type: "import";
      source: atom["Source"];
      specifier: atom["Specifier"] | null;
      location: atom["Tag"];
    }
  | {
      type: "apply";
      function: ShadowValue<atom>;
      this: ShadowValue<atom>;
      arguments: ShadowValue<atom>[];
      location: atom["Tag"];
    }
  | {
      type: "construct";
      function: ShadowValue<atom>;
      arguments: ShadowValue<atom>[];
      location: atom["Tag"];
    }
  | {
      type: "resolve";
      location: atom["Tag"];
    }
  | {
      type: "resume";
      location: atom["Tag"];
    };

export type Value = unknown & { __brand: "Value" };

export type ShadowFrame<atom extends Atom> = {
  [key in Identifier<atom>]?: ShadowValue<atom>;
};

export type ShadowState<atom extends Atom> = {
  parent: ShadowState<atom> | null;
  frame: ShadowFrame<atom>;
  stack: ShadowValue<atom>[];
};
