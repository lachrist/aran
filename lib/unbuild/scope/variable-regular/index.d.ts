import { Hoist } from "../../query/hoist";

export type LifespanBinding = {
  type: "lifespan";
  export: estree.Specifier[];
  writable: boolean;
};

export type DeadzoneBinding = {
  type: "deadzone";
  export: estree.Specifier[];
  writable: boolean;
};

export type ImportBinding = {
  type: "import";
  source: estree.Source;
  specifier: estree.Specifier | null;
};

export type RegularBinding = ImportBinding | LifespanBinding | DeadzoneBinding;

export type RegularFrame = {
  type: "regular";
  module: boolean;
  record: { [k in estree.Variable]?: RegularBinding };
};
