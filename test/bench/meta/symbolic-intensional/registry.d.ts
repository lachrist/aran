import { Wrapper } from "linvail";
import { Origin } from "./origin.js";

export type Registry = {
  __brand: "Registry";
  $has: (this: Registry, key: Wrapper) => boolean;
  $get: (this: Registry, key: Wrapper) => Origin | undefined;
  $set: (this: Registry, key: Wrapper, value: Origin) => void;
};
