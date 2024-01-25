import { PackMeta } from "./unbuild/meta";
import { PackScope } from "./unbuild/scope";

export type GlobalContext = {
  type: "global";
};

export type InternalLocalContext = {
  type: "aran";
  meta: PackMeta;
  scope: PackScope;
};

export type ExternalLocalContext = {
  type: "local";
  mode: "strict" | "sloppy";
  situ:
    | "program"
    | "function"
    | "method"
    | "constructor"
    | "derived-constructor";
};

export type LocalContext = InternalLocalContext | ExternalLocalContext;

export type Context = GlobalContext | LocalContext;
