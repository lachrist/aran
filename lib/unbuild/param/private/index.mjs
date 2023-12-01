import { AranError } from "../../../error.mjs";
import {
  listInitializePrivateDescriptorEffect,
  listSetPrivateDescriptorEffect,
  makeGetPrivateDescriptorExpression,
  overwritePrivateDescriptor,
} from "./descriptor.mjs";
import {
  declarePrivate as declarePrivateInner,
  listInitializePrivateEffect as listInitializeSetPrivateEffectInner,
  makeGetPrivateExpression as makeGetPrivateExpressionInner,
  listSetPrivateEffect as listSetPrivateEffectInner,
} from "./dictionary.mjs";
export {
  listRegisterPrivateSingletonEffect,
  listRegisterPrivateManyEffect,
  makeHasPrivateExpression,
} from "./dictionary.mjs";
export { setupPrivateDescriptor } from "./descriptor.mjs";

/**
 * @template V
 * @template E
 * @typedef {import("../../../util/outcome.mjs").Outcome<V, E>} Outcome
 */

/**
 * @typedef {import("../../cache.mjs").Cache} Cache
 */

/**
 * @template X
 * @typedef {import("../../sequence.d.ts").EffectSequence<X>} EffectSequence
 */

/**
 * @typedef {import("./index.d.ts").Private} Private
 */

/**
 * @typedef {import("./dictionary.d.ts").PrivateCommon} PrivateCommon
 */

/**
 * @typedef {import("./descriptor.d.ts").PrivateDescriptor} PrivateDescriptor
 */

/**
 * @typedef {(
 *   import("./dictionary").RawPrivateDictionary<PrivateDescriptor>
 * )} RawPrivateDictionary
 */

/**
 * @type {<C extends { private: Private }>(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: C,
 *   options: {
 *     entries: [
 *       estree.PrivateKey,
 *       RawPrivateDictionary,
 *     ][],
 *   },
 * ) => EffectSequence<Outcome<{
 *   context: C,
 *   common: PrivateCommon,
 * }, string>>}
 */
export const declarePrivate = (site, context, { entries }) =>
  declarePrivateInner(site, context, { entries, overwritePrivateDescriptor });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: { private: Private },
 *   options: {
 *     kind: "property" | "method"  | "get" | "set",
 *     target: Cache | null,
 *     key: estree.PrivateKey,
 *     value: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listInitializePrivateEffect = (
  { path },
  context,
  { kind, target, key, value },
) =>
  listInitializeSetPrivateEffectInner({ path }, context, {
    target,
    key,
    value,
    listInitializePrivateDescriptorEffect: (
      { path },
      context,
      { descriptor, value },
    ) => {
      if (kind === "property") {
        throw new AranError("invalid private property", {
          kind,
          target,
          key,
          value,
        });
      } else {
        return listInitializePrivateDescriptorEffect({ path }, context, {
          kind,
          descriptor,
          value,
        });
      }
    },
  });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     private: Private,
 *   },
 *   options: {
 *     target: Cache,
 *     key: estree.PrivateKey,
 *   },
 * ) => aran.Expression<unbuild.Atom>}
 */
export const makeGetPrivateExpression = (site, context, { target, key }) =>
  makeGetPrivateExpressionInner(site, context, {
    target,
    key,
    makeGetPrivateDescriptorExpression,
  });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     root: {
 *       situ: "global" | "local",
 *     },
 *     private: Private,
 *   },
 *   options: {
 *     target: Cache,
 *     key: estree.PrivateKey,
 *     value: Cache,
 *   },
 * ) => aran.Effect<unbuild.Atom>[]}
 */
export const listSetPrivateEffect = (site, context, { target, key, value }) =>
  listSetPrivateEffectInner(site, context, {
    target,
    key,
    value,
    listSetPrivateDescriptorEffect,
  });
