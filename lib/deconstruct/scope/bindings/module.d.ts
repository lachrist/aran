export type listBindingVariable<B> = (
  strict: boolean,
  binding: B,
  variable: Variable,
) => Variable[];

export type listBindingDeclareStatement<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  tag: T,
) => Statement<T>[];

export type listBindingInitializeStatement<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  expression: Expression<T>,
  tag: T,
) => Statement<T>[];

export type makeBindingReadExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  tag: T,
) => Expression<T>;

export type makeBindingTypeofExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  tag: T,
) => Expression<T>;

export type makeBindingDiscardExpression<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  tag: T,
) => Expression<T>;

export type listBindingWriteEffect<B, T> = (
  strict: boolean,
  binding: B,
  variable: Variable,
  pure: Expression<T>,
  tag: T,
) => Effect<T>[];

export type BindingModule<B, T> = {
  listBindingVariable: listBindingVariable<B>;
  listBindingDeclareStatement: listBindingDeclareStatement<B, T>;
  listBindingInitializeStatement: listBindingInitializeStatement<B, T>;
  makeBindingReadExpression: makeBindingReadExpression<B, T>;
  makeBindingTypeofExpression: makeBindingTypeofExpression<B, T>;
  makeBindingDiscardExpression: makeBindingDiscardExpression<B, T>;
  listBindingWriteEffect: listBindingWriteEffect<B, T>;
};
