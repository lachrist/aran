import type { Key } from "./visitors/key.d.ts";

export type PropertyName = {
  type: "property";
  kind: "init" | "get" | "set";
  key: Key;
};

export type AssignmentName = {
  type: "assignment";
  variable: estree.Variable;
};

export type AnonymousName = {
  type: "anonymous";
};

export type DefaultName = {
  type: "default";
};

export type Name = PropertyName | AssignmentName | AnonymousName | DefaultName;

// export type Name =
//   | {
//       kind: "init" | "get" | "set";
//       computed: true;
//       access: "public";
//       value: Cache;
//     }
//   | {
//       kind: "init" | "get" | "set";
//       computed: false;
//       access: "public";
//       value: estree.Key;
//     }
//   | {
//       kind: "init" | "get" | "set";
//       computed: false;
//       access: "private";
//       value: estree.PrivateKey;
//     }
//   | {
//       kind: "env";
//       computed: false;
//       access: "public";
//       value: estree.Variable;
//     };

// export type PropertyKey =
//   | {
//       access: "public";
//       computed: true;
//       value: Cache;
//     }
//   | {
//       access: "public";
//       computed: false;
//       value: estree.Key;
//     }
//   | {
//       access: "private";
//       computed: false;
//       value: estree.PrivateKey;
//     };

// export type PropertyName = {
//   kind: "init" | "get" | "set";
//   key: PropertyKey;
// };
