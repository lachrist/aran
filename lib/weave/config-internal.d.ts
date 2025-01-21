import type { GlobalPropertyKey } from "../global_property_key";
import type { ArgAtom } from "./atom";
import type { Config } from "./config";

export type InternalConfig = Config<ArgAtom, GlobalPropertyKey>;
