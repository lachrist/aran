import type { Digest, EvalContext, Serialize } from "./unbuild/context.d.ts";
import type { Pointcut } from "./weave/advice.d.ts";

type CommonOptions<L> = {
  serialize: Serialize<unbuild.Path>;
  digest: Digest;
  locate: (root: unbuild.Root, origin: unbuild.Path, target: weave.Path) => L;
  pointcut: Pointcut<L>;
  advice: estree.Variable;
  intrinsic: estree.Variable;
  prefix: estree.Variable;
  annotation: "copy" | "in-place";
  location: "inline" | "extract";
};

type GlobalOptions<L> = CommonOptions<L> & {
  kind: "module" | "script" | "eval";
  site: "global";
  enclave: boolean;
  strict: false;
  root: unbuild.Root;
  context: null;
};

type ExternalLocalOptions<L> = CommonOptions<L> & {
  kind: "eval";
  site: "local";
  enclave: true;
  strict: boolean;
  root: unbuild.Root;
  context: null;
};

type InternalLocalOptions<L> = CommonOptions<L> & {
  kind: "eval";
  site: "local";
  enclave: false;
  strict: null;
  root: null;
  context: EvalContext;
};

export type Options<L> =
  | GlobalOptions<L>
  | ExternalLocalOptions<L>
  | InternalLocalOptions<L>;
