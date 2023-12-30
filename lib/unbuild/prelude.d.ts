import { Log } from "./log";
import { Header } from "../header";
import { EarlyError } from "./early-error";

export type LogPrelude = {
  type: "log";
  data: Log;
};

export type EarlyErrorPrelude = {
  type: "early-error";
  data: EarlyError;
};

export type HeaderPrelude = {
  type: "header";
  data: Header;
};

export type DeclarationPrelude = {
  type: "declaration";
  data: unbuild.Variable;
};

export type EffectPrelude = {
  type: "effect";
  data: aran.Effect<unbuild.Atom>;
};

export type Prelude =
  | EarlyErrorPrelude
  | LogPrelude
  | HeaderPrelude
  | DeclarationPrelude
  | EffectPrelude;
