import { Ancestry } from "./ancestery";
import { PackMeta } from "./unbuild/meta";
import { PackScope } from "./unbuild/scope";

export type GlobalContext = {
  type: "global";
};

export type InternalLocalContext = {
  type: "internal-local";
  meta: PackMeta;
  scope: PackScope;
};

export type ExternalLocalContext = {
  type: "external-local";
  mode: "strict" | "sloppy";
  program: "module" | "script";
  closure:
    | "none"
    | "function"
    | "method"
    | "constructor"
    | "derived-constructor";
};

export type LocalContext = InternalLocalContext | ExternalLocalContext;

export type Context = GlobalContext | LocalContext;
