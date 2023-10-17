import { map, flatMap } from "./array.mjs";
import { assertEqual } from "../test.fixture.mjs";
import * as Library from "./closure.mjs";

const {
  Array,
  Reflect: { apply },
  String: {
    prototype: { indexOf: indexOfString, lastIndexOf: lastIndexOfString },
  },
  Reflect: { getOwnPropertyDescriptor },
  undefined,
} = globalThis;

/** @type {(x: number) => number} */
const tag = (x) => x + 100;

/** @type {(x: number) => number} */
const untag = (x) => x - 100;

/** @type {(size: number, prefixes: string[]) => string[]} */
const combine = (size, prefixes) => {
  if (size === 0) {
    return [""];
  } else {
    return flatMap(combine(size - 1, prefixes), (body) => [
      body,
      ...map(prefixes, (prefix) => `${prefix}${body}`),
    ]);
  }
};

/** @type {<X> (...xs: X[]) => X[]} */
const listArgument = (...xs) => xs;

/** @type {(start: number, end: number) => number[]} */
const enumerate = (start, end) => {
  const array = Array(end - start);
  for (let index = start; index < end; index += 1) {
    array[index - start] = index;
  }
  return array;
};

for (const description of combine(6, ["_"])) {
  const noop = /** @type {any} */ (Library)[`noop${description}`];
  assertEqual(noop.length, description.length);
  assertEqual(
    apply(noop, undefined, enumerate(0, description.length)),
    undefined,
  );
}

for (const description of combine(7, ["_"])) {
  const constant = /** @type {any} */ (Library)[`constant${description}`];
  const returnResult = constant("result");
  assertEqual(returnResult.length, description.length);
  assertEqual(
    apply(constant("result"), undefined, enumerate(0, description.length)),
    "result",
  );
}

for (const description of combine(6, ["", "_", "$"])) {
  if (getOwnPropertyDescriptor(Library, `return${description}`) !== undefined) {
    const return_ = /** @type {any} */ (Library)[`return${description}`];
    assertEqual(return_.length, description.length);
    assertEqual(
      apply(return_, undefined, enumerate(0, description.length)),
      apply(indexOfString, description, ["$"]),
    );
  }
}

for (const description of ["$$", "_$$", "$_$", "$$_"]) {
  const array = enumerate(0, description.length);
  const index1 = apply(indexOfString, description, ["$"]);
  const index2 = apply(lastIndexOfString, description, ["$"]);
  array[index1] = index2;
  array[index2] = index1;
  // @ts-ignore
  const flip = Library[`flip${description}`];
  const listArgumentFlip = flip(listArgument);
  assertEqual(listArgumentFlip.length, description.length);
  assertEqual(
    apply(listArgumentFlip, undefined, array),
    enumerate(0, description.length),
  );
}

for (const description of [
  ...combine(6, ["", "_", "$", "f"]),
  ...[
    "$_$___$",
    "$$_____",
    "$______",
    "$$$____",
    "$_$____",
    "$$______",
    "$$$_____",
    "$$$______",
    "$$_$_$_$__",
    "$__$$_$_$_",
  ],
]) {
  if (
    getOwnPropertyDescriptor(Library, `partial${description}`) !== undefined
  ) {
    const partial = /** @type {any} */ (Library)[`partial${description}`];
    const xs = [];
    const ys = [];
    for (let index = 0; index < description.length; index += 1) {
      if (description[index] === "$") {
        xs[xs.length] = index;
      } else if (description[index] === "f") {
        xs[xs.length] = untag;
        ys[ys.length] = tag(index);
      } else {
        ys[ys.length] = index;
      }
    }
    assertEqual(
      apply(apply(partial, undefined, [listArgument, ...xs]), undefined, ys),
      enumerate(0, description.length),
    );
  }
}
