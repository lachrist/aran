import type { Cache, WritableCache } from "../../cache.js";

export type PrivateKind = "method" | "getter" | "setter" | "property";

export type RawPrivateFrame = [estree.PrivateKey, PrivateKind][];

export type PrivateBinding =
  | {
      type: "method";
      weakset: Cache;
      method: WritableCache;
    }
  | {
      type: "accessor";
      weakset: Cache;
      getter: WritableCache | null;
      setter: WritableCache | null;
    }
  | {
      type: "property";
      weakmap: Cache;
    };

export type PackPrivateBinding =
  | {
      type: "method";
      method: WritableCache;
    }
  | {
      type: "accessor";
      getter: WritableCache | null;
      setter: WritableCache | null;
    }
  | {
      type: "property";
      weakmap: Cache;
    };

export type PrivateFrame = {
  type: "private";
  weakset: Cache;
  record: Record<estree.PrivateKey, PackPrivateBinding>;
};

// export type ManyPrivateFrame = {};

// export type PrivateBinding =
//   | {
//       type: "method";
//       weakset: Cache;
//     }
//   | {
//       type: "property";
//       weakmap: Cache;
//     };

// export type RawPrivateDescriptor =
//   | {
//       type: "method";
//       method: WritableCache;
//     }
//   | {
//       type: "accessor";
//       get: WritableCache | null;
//       set: WritableCache | null;
//     }
//   | {
//       type: "property";
//     };

// export type PrivateFrame = {};

// export type PrivateCommon = {
//   singleton: WritableCache;
//   many: Cache;
// };

// export type PrivateDescriptor =
//   | {
//       type: "method";
//       method: WritableCache;
//     }
//   | {
//       type: "accessor";
//       get: WritableCache | null;
//       set: WritableCache | null;
//     };

// export type RawPrivateDictionary =
//   | {
//       type: "constant-singleton";
//       descriptor: PrivateDescriptor;
//     }
//   | {
//       type: "variable-singleton";
//     }
//   | {
//       type: "constant-many";
//       descriptor: PrivateDescriptor;
//     }
//   | {
//       type: "variable-many";
//     };

// export type PrivateDictionary =
//   | {
//       type: "constant-singleton";
//       target: WritableCache;
//       descriptor: PrivateDescriptor;
//     }
//   | {
//       type: "variable-singleton";
//       target: WritableCache;
//       value: WritableCache;
//     }
//   | {
//       type: "constant-many";
//       weakset: Cache;
//       descriptor: PrivateDescriptor;
//     }
//   | {
//       type: "variable-many";
//       weakmap: Cache;
//     };

// export type RawPrivateFrame = [estree.PrivateKey, RawPrivateDictionary][];

// export type PrivateFrame = {
//   type: "private";
//   singleton: WritableCache;
//   many: Cache;
//   record: Record<estree.PrivateKey, PrivateDictionary>;
// };
