import type { LabelName } from "estree-sentry";
import type { Label } from "./atom";

export type StatementLabeling = {
  labels: LabelName[];
  loop: {
    break: null | Label;
    continue: null | Label;
  };
};

export type BodyLabeling = {
  labels: Label[];
  loop: {
    break: null | Label;
    continue: null | Label;
  };
};
