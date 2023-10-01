import type { Digest, EvalContext, Serialize } from "./unbuild/context.d.ts";
import type { Pointcut } from "./weave/advice.d.ts";

type CommonOptions<S> = {
  serialize: Serialize<S>;
  digest: Digest;
  pointcut: Pointcut<S>;
  advice: estree.Variable;
  intrinsic: estree.Variable;
  prefix: estree.Variable;
  annotation: "copy" | "in-place";
  serial: "inline" | "extract";
};

type GlobalOptions<S> = CommonOptions<S> & {
  kind: "module" | "script" | "eval";
  site: "global";
  enclave: boolean;
  strict: false;
  root: unbuild.Root;
  context: null;
};

type ExternalLocalOptions<S> = CommonOptions<S> & {
  kind: "eval";
  site: "local";
  enclave: true;
  strict: boolean;
  root: unbuild.Root;
  context: null;
};

type InternalLocalOptions<S> = CommonOptions<S> & {
  kind: "eval";
  site: "local";
  enclave: false;
  strict: null;
  root: null;
  context: EvalContext;
};

export type Options<S> =
  | GlobalOptions<S>
  | ExternalLocalOptions<S>
  | InternalLocalOptions<S>;

// * @type {<S>(
//   *   program: estree.Program,
//   *   options: {
//   *     kind: "module" | "script",
//   *     enclave: boolean,
//   *     strict: false,
//   *     root: unbuild.Root,
//   *     context: null,
//   *     serialize: import("./unbuild/context.d.ts").Serialize<S>,
//   *     digest: import("./unbuild/context.d.ts").Digest,
//   *     pointcut: import("./weave/advice.d.ts").Pointcut<S>,
//   *     advice: estree.Variable,
//   *     intrinsic: estree.Variable,
//   *   } | {
//   *     kind: "eval",
//   *     enclave: true,
//   *     strict: false,
//   *     root: unbuild.Root,
//   *     context: null,
//   *     serialize: import("./unbuild/context.d.ts").Serialize<S>,
//   *     digest: import("./unbuild/context.d.ts").Digest,
//   *     pointcut: import("./weave/advice.d.ts").Pointcut<S>,
//   *     advice: estree.Variable,
//   *     intrinsic: estree.Variable,
//   *   } | {
//   *     kind: "eval",
//   *     enclave: true,
//   *     strict: null,
//   *     root: null,
//   *     context: import("./unbuild/context.d.ts").EvalContext,
//   *     serialize: import("./unbuild/context.d.ts").Serialize<S>,
//   *     digest: import("./unbuild/context.d.ts").Digest,
//   *     pointcut: import("./weave/advice.d.ts").Pointcut<S>,
//   *     advice: estree.Variable,
//   *     intrinsic: estree.Variable,
//   *   },
//   * ) => estree.Program}
