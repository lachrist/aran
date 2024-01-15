import { Hoist } from "../../query/hoist";

export type ArgumentsHoist = {
  type: "regular";
  kind: "arguments";
  variable: estree.Variable;
};

export type CalleeHoist = {
  type: "regular";
  kind: "callee";
  variable: estree.Variable;
};

export type PseudoHoist = ArgumentsHoist | CalleeHoist;

export type LifespanBinding = {
  kind: "var" | "function" | "arguments" | "callee";
  export: estree.Specifier[];
};

export type DeadzoneBinding = {
  kind: "let" | "const" | "class";
  export: estree.Specifier[];
};

export type ImportBinding = {
  kind: "import";
  source: estree.Source;
  specifier: estree.Specifier | null;
};

export type RegularBinding = ImportBinding | LifespanBinding | DeadzoneBinding;

export type RegularFrame = {
  type: "regular";
  record: { [k in estree.Variable]?: RegularBinding };
};
