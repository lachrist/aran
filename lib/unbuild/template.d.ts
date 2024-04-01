import { Site } from "./site";
import { MetaVariable } from "./variable";

export type Template = {
  variable: MetaVariable;
  value: Site<estree.TaggedTemplateExpression>;
};
