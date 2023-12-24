import { Cache } from "./cache";

export type MemberObject =
  | {
      type: "regular";
      data: Cache;
    }
  | {
      type: "super";
    };

export type MemberKey =
  | {
      type: "public";
      data: Cache;
    }
  | {
      type: "private";
      data: estree.PrivateKey;
    };
