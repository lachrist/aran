import { Cache } from "../cache";

export type PublicKey =
  | {
      computed: true;
      access: "public";
      value: Cache;
    }
  | {
      computed: false;
      access: "public";
      value: estree.Key;
    };

export type PrivateKey = {
  computed: false;
  access: "private";
  value: estree.PrivateKey;
};

export type Key = PublicKey | PrivateKey;
