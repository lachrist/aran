/////////////
// Binding //
/////////////

type ExternalBinding = {
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
  source: string;
  specifier: string | null;
};

type MissingBinding = {
  type: "missing";
  enclave: boolean;
};

type RegularBinding = {
  type: "regular";
  deadzone: boolean;
  writable: boolean;
  exports: string[];
};

type Binding =
  | ExternalBinding
  | GlobalBinding
  | HiddenBinding
  | ImportBinding
  | MissingBinding
  | RegularBinding;

////////////
// Module //
////////////

type listBindingVariable<B, T> = (
  strict: boolean,
  binding: B,
  variable: string,
) => string[];

type listBindingDeclareStatement<B, T> = (
  strict: boolean,
  binding: B,
  variable: string,
) => Statement<T>[];

type listBindingInitializeStatement<B, T> = (
  strict: boolean,
  binding: B,
  variable: string,
  expression: Expression<T>,
) => Statement<T>[];

type makeBindingReadExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: string,
) => Expression<T>;

type makeBindingTypeofExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: string,
) => Expression<T>;

type makeBindingDiscardExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: string,
) => Expression<T>;

type listBindingWriteEffect<B, T> = (
  strict: boolean,
  binding: B,
  variable: string,
  pure: Expression<T>,
) => Effect<T>[];

type BindingModule<B, T> = {
  listBindingVariable: listBindingVariable<B, T>;
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
      import: Record<string, { source: string; specifier: string | null }>;
      export: Record<string, string[]>;
    }
  | { type: "eval"; enclave: boolean }
  | { type: "block"; with: Expression<T> | null };

type Frame<T> = {
  root: Binding | null;
  script: boolean;
  static: Record<string, Binding>;
  dynamic: Expression<T> | null;
};

type Scope<T> = {
  frame: Frame<T>;
  parent: Scope<T> | null;
};
