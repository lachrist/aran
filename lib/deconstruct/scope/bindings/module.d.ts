export type listBindingVariable<B> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
) => unbuild.Variable[];

export type listBindingDeclareStatement<B, T> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  tag: T,
) => aran.Statement<unbuild.Atom<T>>[];

export type listBindingInitializeStatement<B, T> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  expression: aran.Expression<unbuild.Atom<T>>,
  tag: T,
) => aran.Statement<unbuild.Atom<T>>[];

export type makeBindingReadExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  tag: T,
) => aran.Expression<unbuild.Atom<T>>;

export type makeBindingTypeofExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  tag: T,
) => aran.Expression<unbuild.Atom<T>>;

export type makeBindingDiscardExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  tag: T,
) => aran.Expression<unbuild.Atom<T>>;

export type listBindingWriteEffect<B, T> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  pure: aran.Expression<unbuild.Atom<T>>,
  tag: T,
) => aran.Effect<unbuild.Atom<T>>[];

export type BindingModule<B, T> = {
  listBindingVariable: listBindingVariable<B>;
  listBindingDeclareStatement: listBindingDeclareStatement<B, T>;
  listBindingInitializeStatement: listBindingInitializeStatement<B, T>;
  makeBindingReadExpression: makeBindingReadExpression<B, T>;
  makeBindingTypeofExpression: makeBindingTypeofExpression<B, T>;
  makeBindingDiscardExpression: makeBindingDiscardExpression<B, T>;
  listBindingWriteEffect: listBindingWriteEffect<B, T>;
};
