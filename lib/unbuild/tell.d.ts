import { Log, MetaVariable } from "../../type/unbuild";
import { Header } from "../header";
import { EvalContext } from "./context";

export type LogTell = {
  type: "log";
  log: Log;
};

export type DeclarationTell = {
  type: "declaration";
  variable: MetaVariable;
};

export type ContextTell = {
  type: "context";
  context: EvalContext;
};

export type HeaderTell = {
  type: "header";
  header: Header;
};

export type Tell = LogTell | DeclarationTell | ContextTell | HeaderTell;
