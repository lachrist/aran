import type { Cache } from "./cache.mjs";

export type Key =
  | {
      access: "public";
      computed: true;
      value: Cache;
    }
  | {
      access: "public";
      computed: false;
      value: estree.Key;
    }
  | {
      access: "private";
      computed: false;
      value: estree.PrivateKey;
    };
