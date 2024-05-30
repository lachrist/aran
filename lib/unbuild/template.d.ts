import type { TaggedTemplateExpression } from "../estree";
import type { Site } from "./site";
import type { MetaVariable } from "./variable";

export type Template = {
  variable: MetaVariable;
  value: Site<TaggedTemplateExpression>;
};
