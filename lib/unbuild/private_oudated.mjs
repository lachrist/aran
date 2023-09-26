import { DynamicSyntaxAranError } from "../error.mjs";
import { StaticError, includes } from "../util/index.mjs";
import {
  makeBinaryExpression,
  makeGetExpression,
  makeSetExpression,
  makeThrowErrorExpression,
} from "./intrinsic.mjs";
import {
  makeApplyExpression,
  makeConditionalExpression,
  makeIntrinsicExpression,
  makePrimitiveExpression,
  makeReadExpression,
} from "./node.mjs";

// console.log("foo"); class c { static #foo = 123; m () { return c.#bar; } }

/**
 * @typedef {{
 *   class: {
 *     fields: estree.PrivateKey[],
 *     public: unbuild.Variable,
 *     private: unbuild.Variable,
 *   },
 *   instances: {
 *     fields: estree.PrivateKey[],
 *     weakmap: unbuild.Variable,
 *   },
 * }} PrivateFrame
 */

/**
 * @typedef {{
 *   type: "frame",
 *   frame: PrivateFrame,
 *   parent: Private
 * } | {
 *   type: "root",
 *   enclave: boolean,
 * }} Private
 */

/**
 * @type {<S, X>(
 *   private_: Private,
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   value: X,
 *   serial: S,
 *   makeLookupExpression: (
 *     private_object: aran.Expression<unbuild.Atom<S>>,
 *     key: aran.Expression<unbuild.Atom<S>>,
 *     value: X,
 *     serial: S,
 *   ) => aran.Expression<unbuild.Atom<S>>,
 *   makeEnclaveLookupExpression: (
 *     public_object: aran.Expression<unbuild.Atom<S>>,
 *     key: aran.Expression<unbuild.Atom<S>>,
 *     value: X,
 *     serial: S,
 *   ) => aran.Expression<unbuild.Atom<S>>,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeLookupPrivateExpression = (
  private_,
  object,
  key,
  value,
  serial,
  makeLookupExpression,
  makeEnclaveLookupExpression,
) => {
  switch (private_.type) {
    case "frame":
      return makeConditionalExpression(
        makeBinaryExpression(
          "===",
          makeReadExpression(object, serial),
          makeReadExpression(private_.frame.class.public, serial),
          serial,
        ),
        includes(private_.frame.class.fields, key)
          ? makeLookupExpression(
              makeReadExpression(private_.frame.class.private, serial),
              makePrimitiveExpression(key, serial),
              value,
              serial,
            )
          : makeThrowErrorExpression(
              "TypeError",
              `Cannot read private member #${key}`,
              serial,
            ),
        makeConditionalExpression(
          makeApplyExpression(
            makeIntrinsicExpression("WeakMap.prototype.has", serial),
            makeReadExpression(private_.frame.instances.weakmap, serial),
            [makeReadExpression(object, serial)],
            serial,
          ),
          includes(private_.frame.class.fields, key)
            ? makeLookupExpression(
                makeApplyExpression(
                  makeIntrinsicExpression("WeakMap.prototype.get", serial),
                  makeReadExpression(private_.frame.instances.weakmap, serial),
                  [makeReadExpression(object, serial)],
                  serial,
                ),
                makePrimitiveExpression(key, serial),
                value,
                serial,
              )
            : makeThrowErrorExpression(
                "TypeError",
                `Cannot read private member #${key}`,
                serial,
              ),
          makeLookupPrivateExpression(
            private_.parent,
            object,
            key,
            value,
            serial,
            makeLookupExpression,
            makeEnclaveLookupExpression,
          ),
          serial,
        ),
        serial,
      );
    case "root":
      if (!private_.enclave) {
        throw new DynamicSyntaxAranError("illegal private get expression");
      }
      return makeApplyExpression(
        makeReadExpression("private.get", serial),
        makePrimitiveExpression({ undefined: null }, serial),
        [
          makeReadExpression(object, serial),
          makePrimitiveExpression(key, serial),
        ],
        serial,
      );
    default:
      throw new StaticError("invalid private", private_);
  }
};

/**
 * @type {<S>(
 *   private_object: aran.Expression<unbuild.Atom<S>>,
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: null,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeHitGetPrivateExpression = (private_object, key, _value, serial) =>
  makeGetExpression(private_object, key, serial);

/**
 * @type {<S>(
 *   public_object: aran.Expression<unbuild.Atom<S>>,
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: null,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeMissGetPrivateExpression = (public_object, key, _value, serial) =>
  makeApplyExpression(
    makeReadExpression("private.get", serial),
    makePrimitiveExpression({ undefined: null }, serial),
    [public_object, key],
    serial,
  );

/**
 * @type {<S>(
 *   private_: Private,
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeGetPrivateExpression = (private_, object, key, serial) =>
  makeLookupPrivateExpression(
    private_,
    object,
    key,
    null,
    serial,
    makeHitGetPrivateExpression,
    makeMissGetPrivateExpression,
  );

/**
 * @type {<S>(
 *   private_object: aran.Expression<unbuild.Atom<S>>,
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeHitSetPrivateExpression = (private_object, key, value, serial) =>
  makeSetExpression(true, private_object, key, value, serial);

/**
 * @type {<S>(
 *   public_object: aran.Expression<unbuild.Atom<S>>,
 *   key: aran.Expression<unbuild.Atom<S>>,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
const makeMissSetPrivateExpression = (public_object, key, value, serial) =>
  makeApplyExpression(
    makeReadExpression("private.set", serial),
    makePrimitiveExpression({ undefined: null }, serial),
    [public_object, key, value],
    serial,
  );

/**
 * @type {<S>(
 *   private_: Private,
 *   object: unbuild.Variable,
 *   key: estree.PrivateKey,
 *   value: aran.Expression<unbuild.Atom<S>>,
 *   serial: S,
 * ) => aran.Expression<unbuild.Atom<S>>}
 */
export const makeSetPrivateExpression = (
  private_,
  object,
  key,
  value,
  serial,
) =>
  makeLookupPrivateExpression(
    private_,
    object,
    key,
    value,
    serial,
    makeHitSetPrivateExpression,
    makeMissSetPrivateExpression,
  );

//   switch (private_.type) {
//     case "frame":
//       return makeConditionalExpression(
//         makeBinaryExpression(
//           "===",
//           makeReadExpression(object, serial),
//           makeReadExpression(private_.frame.class.public, serial),
//           serial,
//         ),
//         includes(private_.frame.class.fields, key)
//           ? makeGetExpression(
//               makeReadExpression(private_.frame.class.private, serial),
//               makePrimitiveExpression(key, serial),
//               serial,
//             )
//           : makeThrowErrorExpression(
//               "TypeError",
//               `Cannot read private member #${key}`,
//               serial,
//             ),
//         makeConditionalExpression(
//           makeApplyExpression(
//             makeIntrinsicExpression("WeakMap.prototype.has", serial),
//             makeReadExpression(private_.frame.instances.weakmap, serial),
//             [makeReadExpression(object, serial)],
//             serial,
//           ),
//           includes(private_.frame.class.fields, key)
//             ? makeGetExpression(
//                 makeApplyExpression(
//                   makeIntrinsicExpression("WeakMap.prototype.get", serial),
//                   makeReadExpression(private_.frame.instances.weakmap, serial),
//                   [makeReadExpression(object, serial)],
//                   serial,
//                 ),
//                 makePrimitiveExpression(key, serial),
//                 serial,
//               )
//             : makeThrowErrorExpression(
//                 "TypeError",
//                 `Cannot read private member #${key}`,
//                 serial,
//               ),
//           makeGetPrivateExpression(
//             strict,
//             private_.parent,
//             object,
//             key,
//             serial,
//           ),
//           serial,
//         ),
//         serial,
//       );
//     case "root":
//       if (!private_.enclave) {
//         throw new DynamicSyntaxAranError("illegal private get expression");
//       }
//       return makeApplyExpression(
//         makeReadExpression("private.get", serial),
//         makePrimitiveExpression({ undefined: null }, serial),
//         [
//           makeReadExpression(object, serial),
//           makePrimitiveExpression(key, serial),
//         ],
//         serial,
//       );
//     default:
//       throw new StaticError("invalid private", private_);
//   }
// };

// /**
//  * @type {<S>(
//  *   strict: boolean,
//  *   private_: Private,
//  *   object: unbuild.Variable,
//  *   key: estree.Variable,
//  *   value: unbuild.Variable,
//  *   serial: S,
//  * ) => aran.Expression<unbuild.Atom<S>>}
//  */
// const makeSetPrivateExpression = (
//   strict,
//   private_,
//   object,
//   key,
//   value,
//   serial,
// ) => {
//   switch (private_.type) {
//     case "frame":
//       return makeConditionalExpression(
//         makeBinaryExpression(
//           "===",
//           makeReadExpression(object, serial),
//           makeReadExpression(private_.frame.class.public, serial),
//           serial,
//         ),
//         includes(private_.frame.class.fields, key)
//           ? makeSetExpression(
//               strict,
//               makeReadExpression(private_.frame.class.private, serial),
//               makePrimitiveExpression(key, serial),
//               makeReadExpression(value, serial),
//               serial,
//             )
//           : makeThrowErrorExpression(
//               "TypeError",
//               `Cannot read private member #${key}`,
//               serial,
//             ),
//         makeConditionalExpression(
//           makeApplyExpression(
//             makeIntrinsicExpression("WeakMap.prototype.has", serial),
//             makeReadExpression(private_.frame.instances.weakmap, serial),
//             [makeReadExpression(object, serial)],
//             serial,
//           ),
//           includes(private_.frame.class.fields, key)
//             ? makeSetExpression(
//                 strict,
//                 makeApplyExpression(
//                   makeIntrinsicExpression("WeakMap.prototype.get", serial),
//                   makeReadExpression(private_.frame.instances.weakmap, serial),
//                   [makeReadExpression(object, serial)],
//                   serial,
//                 ),
//                 makePrimitiveExpression(key, serial),
//                 makeReadExpression(value, serial),
//                 serial,
//               )
//             : makeThrowErrorExpression(
//                 "TypeError",
//                 `Cannot read private member #${key}`,
//                 serial,
//               ),
//           makeGetPrivateExpression(
//             strict,
//             private_.parent,
//             object,
//             key,
//             serial,
//           ),
//           serial,
//         ),
//         serial,
//       );
//     case "root":
//       if (!private_.enclave) {
//         throw new DynamicSyntaxAranError("illegal private get expression");
//       }
//       return makeApplyExpression(
//         makeReadExpression("private.get", serial),
//         makePrimitiveExpression({ undefined: null }, serial),
//         [
//           makeReadExpression(object, serial),
//           makePrimitiveExpression(key, serial),
//         ],
//         serial,
//       );
//     default:
//       throw new StaticError("invalid private", private_);
//   }
// };

// // (new (class {
// //   #foo = 123;
// //   m (k) {
// //     return eval(`
// //       const private_get = (o, k) => eval("o.#" + k);
// //       private_get(this, "foo");
// //     `);
// //   }
// // })).m("foo");

// function f() {
//   return class {
//     static #foo = 123;
//     static m(x) {
//       return x.#foo;
//     }
//   };
// }

// const c1 = f();
// const c2 = f();
// c1.m(c2);

// (class c1 {
//   #foo = 123;
//   static m1() {
//     return class c2 {
//       static #foo = 456;
//       static m2(x) {
//         return x.#foo;
//       }
//     };
//   }
// })
//   .m1()
//   .m2(true);

// class c2 {
//   static #foo = 456;
// }

// var x = c2;
// c1.m();

// (class c1 {
//   static foo = 123;
//   foo = 456;
//   static m1() {
//     return c1.foo;
//   }
// }).m1();

// /**
//  * @type {<S>(
//  *   context: { private: Private },
//  *   object: aran.Expression<unbuild.Atom<S>>,
//  *   key: aran.Expression<unbuild.Atom<S>>,
//  *   serial: S,
//  * ) => aran.Expression<unbuild.Atom<S>>}
//  */
// export const makePrivateGetExpression = (context, object, key, serial) => {
//   switch (context.private) {
//     case "internal":
//       return makeGetExpression(
//         makeApplyExpression(
//           makeIntrinsicExpression("WeakMap.prototype.get", serial),
//           makeIntrinsicExpression("aran.private", serial),
//           [object],
//           serial,
//         ),
//         key,
//         serial,
//       );
//     case "external":
//       return makeApplyExpression(
//         makeReadExpression("private.get", serial),
//         makePrimitiveExpression({ undefined: null }, serial),
//         [object, key],
//         serial,
//       );
//     case "none":
//       throw new DynamicSyntaxAranError("illegal private get expression");
//     default:
//       throw new StaticError("invalid private", context.private);
//   }
// };

// /**
//  * @type {<S>(
//  *   context: { strict: boolean, private: Private },
//  *   object: aran.Expression<unbuild.Atom<S>>,
//  *   key: aran.Expression<unbuild.Atom<S>>,
//  *   value: aran.Expression<unbuild.Atom<S>>,
//  *   serial: S,
//  * ) => aran.Expression<unbuild.Atom<S>>}
//  */
// export const makePrivateSetExpression = (
//   context,
//   object,
//   key,
//   value,
//   serial,
// ) => {
//   switch (context.private) {
//     case "internal":
//       return makeSetExpression(
//         context.strict,
//         makeApplyExpression(
//           makeIntrinsicExpression("WeakMap.prototype.get", serial),
//           makeIntrinsicExpression("aran.private", serial),
//           [object],
//           serial,
//         ),
//         key,
//         value,
//         serial,
//       );
//     case "external":
//       return makeApplyExpression(
//         makeReadExpression("private.set", serial),
//         makePrimitiveExpression({ undefined: null }, serial),
//         [object, key, value],
//         serial,
//       );
//     case "none":
//       throw new DynamicSyntaxAranError("illegal private get expression");
//     default:
//       throw new StaticError("invalid private", context.private);
//   }
// };
