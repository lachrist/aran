import type { Config } from "./config";
import type { ArgAtom } from "../atom";
import type { GlobalPropertyKey } from "../../global_property_key";

export type InternalConfig = Config<ArgAtom, GlobalPropertyKey>;
