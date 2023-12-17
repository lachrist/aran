export type HoistingRegularKind = "var" | "function" | "callee";

export type DeadzoneRegularKind = "let" | "const" | "class";

export type RegularKind = HoistingRegularKind | DeadzoneRegularKind;

export type HoistingRegularBinding = {
  kind: HoistingRegularKind;
  export: estree.Specifier[];
};

export type DeadzoneRegularBinding = {
  kind: DeadzoneRegularKind;
  export: estree.Specifier[];
};

export type RegularBinding = HoistingRegularBinding | DeadzoneRegularBinding;
