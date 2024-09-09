import type { Pair } from "../util/pair";
import type { Variable } from "../estree";
import type { Status } from "./scope/operation";
import type { List } from "../util/list";

export type Update = Pair<Variable, Status>;

export type Deadzone = List<Update[]>;
