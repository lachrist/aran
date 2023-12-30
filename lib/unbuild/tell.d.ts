import { Variable } from "../../type/unbuild";
import { Header } from "../header";
import { Context } from "./context";
import { EarlyError } from "./early-error";
import { Log } from "./log";

export type LogTell = {
  type: "log";
  data: Log;
};

export type EarlyErrorTell = {
  type: "error";
  data: EarlyError;
};

export type DeclarationTell = {
  type: "declaration";
  data: Variable;
};

export type ContextTell = {
  type: "context";
  data: Context;
};

export type HeaderTell = {
  type: "header";
  data: Header;
};

export type Tell =
  | LogTell
  | EarlyErrorTell
  | DeclarationTell
  | ContextTell
  | HeaderTell;
