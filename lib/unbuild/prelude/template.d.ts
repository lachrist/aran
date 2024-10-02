import type { TaggedTemplateExpression } from "estree-sentry";
import type { HashProp } from "../../hash";
import type { MetaVariable } from "../variable";

export type Template = {
  variable: MetaVariable;
  value: TaggedTemplateExpression<HashProp>;
};
