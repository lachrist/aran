import type { Effect, Expression } from "../atom";
import type { Hash } from "../../hash";
import type { Meta } from "../meta";
import type { Sequence } from "../../sequence";

// Extend //

export type Extend<X, O, W> = <Y extends X>(
  hash: Hash,
  meta: Meta,
  parent: Y,
  options: O,
) => Sequence<W, Y>;

// Setup //

export type Setup<O, W, X> = (
  hash: Hash,
  meta: Meta,
  options: O,
) => Sequence<W, X>;

// Perform //

export type Perform<B, O, X> = (
  hash: Hash,
  meta: Meta,
  bind: B,
  operation: O,
) => X;

export type PerformEffect<B, O, W> = Perform<B, O, Sequence<W, Effect[]>>;

export type PerformMaybeEffect<B, O, W> = Perform<
  B,
  O,
  null | Sequence<W, Effect[]>
>;

export type PerformExpression<B, O, W> = Perform<B, O, Sequence<W, Expression>>;

export type PerformMaybeExpression<B, O, W> = Perform<
  B,
  O,
  null | Sequence<W, Expression>
>;

// Update //

export type Update<B, O, W, X> = (
  hash: Hash,
  meta: Meta,
  bind: B,
  operation: O,
) => Sequence<W, [X, B]>;

export type UpdateExpression<B, O, W> = Update<B, O, W, Expression>;

export type UpdateEffect<B, O, W> = Update<B, O, W, Effect[]>;

// Intercept //

export type Intercept<B, O, W, X> = (
  hash: Hash,
  meta: Meta,
  bind: B,
  operation: O,
  alternate: X,
) => Sequence<W, X>;

export type InterceptEffect<B, O, W> = Intercept<B, O, W, Effect[]>;

export type InterceptExpression<B, O, W> = Intercept<B, O, W, Expression>;
