import type { Hash } from "../../hash";
import type { Tree } from "../../util/tree";
import type { VariableName } from "estree-sentry";

type Frame = { [key in VariableName]: "live" | "dead" };

type Bound = "declaration" | "expression";

type Scope = (Frame | Bound)[];

type Status = "live" | "dead" | "schrodinger";

type Deadzone = Tree<[Hash, Status]>;
