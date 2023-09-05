/////////////
// Binding //
/////////////

type EnclaveBinding = {
  type: "external";
  kind: "var" | "let" | "const";
};

type GlobalBinding = { type: "global" };

type HiddenBinding = {
  type: "hidden";
  writable: boolean;
};

type ImportBinding = {
  type: "import";
  source: Source;
  specifier: Specifier | null;
};

type MissingBinding = {
  type: "missing";
  enclave: boolean;
};

type RegularBinding = {
  type: "regular";
  deadzone: boolean;
  writable: boolean;
  exports: Specifier[];
};

type Binding =
  | EnclaveBinding
  | GlobalBinding
  | HiddenBinding
  | ImportBinding
  | MissingBinding
  | RegularBinding;

////////////
// Module //
////////////

type listBindingVariable<B> = (
  strict: boolean,
  binding: B,
  variable: Variable,
) => Variable[];

type listBindingDeclareStatement<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  tag: T,
) => Statement<T>[];

type listBindingInitializeStatement<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  expression: Expression<T>,
  tag: T,
) => Statement<T>[];

type makeBindingReadExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  tag: T,
) => Expression<T>;

type makeBindingTypeofExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  tag: T,
) => Expression<T>;

type makeBindingDiscardExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  tag: T,
) => Expression<T>;

type listBindingWriteEffect<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  pure: Expression<T>,
  tag: T,
) => Effect<T>[];

type BindingModule<B, T> = {
  listBindingVariable: listBindingVariable<B>;
  listBindingDeclareStatement: listBindingDeclareStatement<B, T>;
  listBindingInitializeStatement: listBindingInitializeStatement<B, T>;
  makeBindingReadExpression: makeBindingReadExpression<B, T>;
  makeBindingTypeofExpression: makeBindingTypeofExpression<B, T>;
  makeBindingDiscardExpression: makeBindingDiscardExpression<B, T>;
  listBindingWriteEffect: listBindingWriteEffect<B, T>;
};

///////////
// Frame //
///////////

type FrameContext<T> =
  | { type: "script"; enclave: boolean }
  | {
      type: "module";
      enclave: boolean;
      import: Record<Variable, { source: Source; specifier: Specifier | null }>;
      export: Record<Variable, Specifier[]>;
    }
  | { type: "eval"; enclave: boolean }
  | { type: "block"; with: Expression<T> | null };

type Frame<T> = {
  root: Binding | null;
  script: boolean;
  static: Record<Variable, Binding>;
  dynamic: Expression<T> | null;
};

type Scope<T> = {
  frame: Frame<T>;
  parent: Scope<T> | null;
};
