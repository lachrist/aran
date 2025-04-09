import type { TaggedTemplateExpression } from "estree-sentry";
import type { HashProp } from "../hash.d.ts";
import type { MetaVariable } from "../variable.d.ts";

export type Template = {
  variable: MetaVariable;
  value: TaggedTemplateExpression<HashProp>;
};
