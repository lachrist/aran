import { Log } from "../../type/unbuild";
import { Header } from "../header";

export type LogPrelude = {
  type: "log";
  data: Log;
};

export type HeaderPrelude = {
  type: "header";
  data: Header;
};

export type VariablePrelude = {
  type: "variable";
  data: unbuild.Variable;
};

export type HeadPrelude = {
  type: "head";
  data: aran.Statement<unbuild.Atom>;
};

export type BodyPrelude = {
  type: "body";
  data: aran.Statement<unbuild.Atom>;
};

export type Prelude =
  | LogPrelude
  | HeaderPrelude
  | VariablePrelude
  | HeadPrelude
  | BodyPrelude;
