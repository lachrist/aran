import type { Effect, Expression } from "../atom";
import type { Hash } from "../../hash";
import type { Meta } from "../meta";
import type { Sequence } from "../../sequence";

// Extend //

export type Extend<O, W, X> = <Y extends X>(
  hash: Hash,
  meta: Meta,
  options: O,
  parent: Y,
) => Sequence<W, Y>;

// Setup //

export type Setup<O, W, X> = (
  hash: Hash,
  meta: Meta,
  options: O,
) => Sequence<W, X>;

// Perform //

export type Perform<B, O, W, X> = (
  hash: Hash,
  meta: Meta,
  bind: B,
  operation: O,
) => Sequence<W, X>;

export type PerformMaybe<B, O, W, X> = (
  hash: Hash,
  meta: Meta,
  bind: B,
  operation: O,
) => null | Sequence<W, X>;

export type PerformEffect<B, O, W> = Perform<B, O, W, Effect[]>;

export type PerformMaybeEffect<B, O, W> = PerformMaybe<B, O, W, Effect[]>;

export type PerformExpression<B, O, W> = Perform<B, O, W, Expression>;

export type PerformMaybeExpression<B, O, W> = PerformMaybe<B, O, W, Expression>;

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
