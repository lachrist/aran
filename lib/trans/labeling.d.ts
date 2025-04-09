import type { LabelName } from "estree-sentry";
import type { Label } from "./atom.d.ts";
import type { Tree } from "../util/tree.d.ts";

export type StatementLabeling = {
  labels: Tree<LabelName>;
  loop: {
    break: null | Label;
    continue: null | Label;
  };
};

export type BodyLabeling = {
  labels: Tree<Label>;
  loop: {
    break: null | Label;
    continue: null | Label;
  };
};
