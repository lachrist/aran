export type listBindingVariable<B> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
) => unbuild.Variable[];

export type listBindingDeclareStatement<B, S> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  serial: S,
) => aran.Statement<unbuild.Atom<S>>[];

export type listBindingInitializeStatement<B, S> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  right: aran.Expression<unbuild.Atom<S>>,
  serial: S,
) => aran.Statement<unbuild.Atom<S>>[];

export type makeBindingReadExpression<B, S> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  serial: S,
) => aran.Expression<unbuild.Atom<S>>;

export type makeBindingTypeofExpression<B, S> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  serial: S,
) => aran.Expression<unbuild.Atom<S>>;

export type makeBindingDiscardExpression<B, S> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  serial: S,
) => aran.Expression<unbuild.Atom<S>>;

export type listBindingWriteEffect<B, S> = (
  strict: boolean,
  binding: B,
  variable: estree.Variable,
  right: aran.Parameter | unbuild.Variable,
  serial: S,
) => aran.Effect<unbuild.Atom<S>>[];

export type BindingModule<B, S> = {
  listBindingVariable: listBindingVariable<B>;
  listBindingDeclareStatement: listBindingDeclareStatement<B, S>;
  listBindingInitializeStatement: listBindingInitializeStatement<B, S>;
  makeBindingReadExpression: makeBindingReadExpression<B, S>;
  makeBindingTypeofExpression: makeBindingTypeofExpression<B, S>;
  makeBindingDiscardExpression: makeBindingDiscardExpression<B, S>;
  listBindingWriteEffect: listBindingWriteEffect<B, S>;
};
