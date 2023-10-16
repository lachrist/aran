import Curly from "./rules/curly.mjs";
import LiteralBasename from "./rules/literal-basename.mjs";
import LiteralUnique from "./rules/literal-unique.mjs";
import NoAssignmentExpression from "./rules/no-assignment-expression.mjs";
import NoAsync from "./rules/no-async.mjs";
import NoClass from "./rules/no-class.mjs";
import NoDependency from "./rules/no-dependency.mjs";
import NoEmptyReturn from "./rules/no-empty-return.mjs";
import NoFunction from "./rules/no-function.mjs";
import NoGlobal from "./rules/no-global.mjs";
import NoImpure from "./rules/no-impure.mjs";
import NoLabel from "./rules/no-label.mjs";
import NoMethodCall from "./rules/no-method-call.mjs";
import NoOptionalChaining from "./rules/no-optional-chaining.mjs";
import NoOptionalParameter from "./rules/no-optional-parameter.mjs";
import NoPureStatement from "./rules/no-pure-statement.mjs";
import NoRestParameter from "./rules/no-rest-parameter.mjs";
import StandardDeclaration from "./rules/standard-declaration.mjs";
import StrictConsole from "./rules/strict-console.mjs";

export default {
  "curly": Curly,
  "literal-basename": LiteralBasename,
  "literal-unique": LiteralUnique,
  "no-assignment-expression": NoAssignmentExpression,
  "no-async": NoAsync,
  "no-class": NoClass,
  "no-dependency": NoDependency,
  "no-empty-return": NoEmptyReturn,
  "no-function": NoFunction,
  "no-global": NoGlobal,
  "no-impure": NoImpure,
  "no-label": NoLabel,
  "no-method-call": NoMethodCall,
  "no-optional-chaining": NoOptionalChaining,
  "no-optional-parameter": NoOptionalParameter,
  "no-pure-statement": NoPureStatement,
  "no-rest-parameter": NoRestParameter,
  "standard-declaration": StandardDeclaration,
  "strict-console": StrictConsole,
};
