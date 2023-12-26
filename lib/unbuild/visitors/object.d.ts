import type { Cache } from "../cache.d.ts";

export type SuperObject = {
  type: "super";
};

export type RegularObject = {
  type: "regular";
  data: Cache;
};

export type Object = SuperObject | RegularObject;
