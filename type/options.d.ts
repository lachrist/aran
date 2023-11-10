import type { Context } from "../lib/unbuild/context.d.ts";
import type { Pointcut } from "./advice.js";

export type Root = Brand<string, "options.Root">;

export type AdviceKind = "function" | "object";

export type Advice = {
  kind: AdviceKind;
  variable: estree.Variable;
};

export type Locate<L> = (origin: weave.OriginPath, root: Root) => L;

//////////////////////
// Internal Options //
//////////////////////

type CommonOptions<L> = {
  locate: Locate<L>;
  pointcut: Pointcut<L>;
  advice: Advice;
  intrinsic: estree.Variable;
  escape: estree.Variable;
};

type GlobalOptions<L> = CommonOptions<L> & {
  kind: "module" | "script" | "eval";
  situ: "global";
  enclave: boolean;
  strict: false;
  root: Root;
  context: null;
};

type ExternalLocalOptions<L> = CommonOptions<L> & {
  kind: "eval";
  situ: "local";
  enclave: true;
  strict: boolean;
  root: Root;
  context: null;
};

type InternalLocalOptions<L> = CommonOptions<L> & {
  kind: "eval";
  situ: "local";
  enclave: false;
  strict: null;
  root: null;
  context: Context & { meta: "string" };
};

export type Options<L> =
  | GlobalOptions<L>
  | ExternalLocalOptions<L>
  | InternalLocalOptions<L>;

//////////////////////
// External Options //
//////////////////////

type CommonUserOptions<L> = {
  locate?: Locate<L>;
  pointcut?: Pointcut<L>;
  advice?: Advice;
  intrinsic?: estree.Variable;
  escape?: estree.Variable;
};

type GlobalUserOptions<L> = CommonUserOptions<L> & {
  kind?: "module" | "script" | "eval";
  situ?: "global";
  enclave?: boolean;
  strict?: false;
  root?: Root;
  context?: null;
};

type ExternalLocalUserOptions<L> = CommonUserOptions<L> & {
  kind?: "eval";
  situ?: "local";
  enclave?: true;
  strict?: boolean;
  root?: Root;
  context?: null;
};

type InternalLocalUserOptions<L> = CommonUserOptions<L> & {
  kind?: "eval";
  situ?: "local";
  enclave?: false;
  strict?: null;
  root?: null;
  context?: Context & { path: weave.OriginPath };
};

export type UserOptions<L> =
  | GlobalUserOptions<L>
  | ExternalLocalUserOptions<L>
  | InternalLocalUserOptions<L>;
