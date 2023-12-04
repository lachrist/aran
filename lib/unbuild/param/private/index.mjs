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
 * @type {<C extends {
 *   private: import("./index.d.ts").Private,
 * }>(
 *   site: {
 *     path: unbuild.Path,
 *     meta: unbuild.Meta,
 *   },
 *   context: C,
 *   options: {
 *     entries: [
 *       estree.PrivateKey,
 *       import("./dictionary").RawPrivateDictionary<
 *         import("./descriptor.d.ts").PrivateDescriptor
 *       >,
 *     ][],
 *   },
 * ) => import("../../sequence.d.ts").EffectSequence<
 *   import("../../../util/outcome.d.ts").Outcome<
 *     {
 *       context: C,
 *       common: import("./dictionary.d.ts").PrivateCommon,
 *     },
 *     string
 *   >
 * >}
 */
export const declarePrivate = (site, context, { entries }) =>
  declarePrivateInner(site, context, { entries, overwritePrivateDescriptor });

/**
 * @type {(
 *   site: {
 *     path: unbuild.Path,
 *   },
 *   context: {
 *     private: import("./index.d.ts").Private,
 *   },
 *   options: {
 *     kind: "property" | "method"  | "get" | "set",
 *     target: import("../../cache.d.ts").Cache | null,
 *     key: estree.PrivateKey,
 *     value: import("../../cache.d.ts").Cache,
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
 *     private: import("./index.d.ts").Private,
 *   },
 *   options: {
 *     target: import("../../cache.d.ts").Cache,
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
 *     private: import("./index.d.ts").Private,
 *   },
 *   options: {
 *     target: import("../../cache.d.ts").Cache,
 *     key: estree.PrivateKey,
 *     value: import("../../cache.d.ts").Cache,
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
