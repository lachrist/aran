import type { EvalContext } from "../lib/unbuild/context.d.ts";
import type { Pointcut } from "./advice.js";

export type Root = Brand<string, "unbuild.Root">;

export type Locate<L> = (
  root: Root,
  origin: weave.OriginPath,
  target: weave.TargetPath,
) => L;

type CommonOptions<L> = {
  locate: Locate<L>;
  pointcut: Pointcut<L>;
  advice: estree.Variable;
  intrinsic: estree.Variable;
  prefix: estree.Variable;
  location: "inline" | "extract";
};

type GlobalOptions<L> = CommonOptions<L> & {
  kind: "module" | "script" | "eval";
  site: "global";
  enclave: boolean;
  strict: false;
  root: Root;
  context: null;
};

type ExternalLocalOptions<L> = CommonOptions<L> & {
  kind: "eval";
  site: "local";
  enclave: true;
  strict: boolean;
  root: Root;
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
