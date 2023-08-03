////////////
// Lookup //
////////////

type ReadLookup = { type: "read" };

type TypeofLookup = { type: "typeof" };

type DiscardLookup = { type: "discard" };

type WriteLookup<T> = {
  type: "write";
  right: Expression<T>;
  optimist: boolean;
};

type Lookup<T> = ReadLookup | TypeofLookup | DiscardLookup | WriteLookup<T>;

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
};

type RegularBinding = {
  type: "regular";
  writable: boolean;
  exports: string[];
  switch: boolean;
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

type makeBindingLookupNode<B, T> = (
  strict: boolean,
  binding: B,
  variable: string,
  escaped: boolean,
  lookup: Lookup<T>,
) => Expression<T> | Effect<T> | null;

type BindingModule<B, T> = {
  listBindingVariable?: listBindingVariable<B, T>;
  listBindingDeclareStatement?: listBindingDeclareStatement<B, T>;
  listBindingInitializeStatement?: listBindingInitializeStatement<B, T>;
  makeBindingLookupNode: makeBindingLookupNode<B, T>;
};
