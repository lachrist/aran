import { Cache } from "./cache";

export type PublicKey =
  | {
      computed: true;
      access: "public";
      cooked: boolean;
      value: Cache;
    }
  | {
      computed: false;
      access: "public";
      cooked: true;
      value: estree.Key;
    };

export type PrivateKey = {
  computed: false;
  access: "private";
  cooked: true;
  value: estree.PrivateKey;
};

export type Key = PublicKey | PrivateKey;
