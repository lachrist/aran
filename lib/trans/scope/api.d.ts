import type { Effect, Expression } from "../atom.d.ts";
import type { Hash } from "../hash.d.ts";
import type { Meta } from "../meta.d.ts";
import type { Sequence } from "../../util/sequence.d.ts";
import type { Tree } from "../../util/tree.d.ts";

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

export type PerformEffect<B, O, W> = Perform<B, O, W, Tree<Effect>>;

export type PerformMaybeEffect<B, O, W> = PerformMaybe<B, O, W, Tree<Effect>>;

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

export type InterceptEffect<B, O, W> = Intercept<B, O, W, Tree<Effect>>;

export type InterceptExpression<B, O, W> = Intercept<B, O, W, Expression>;
