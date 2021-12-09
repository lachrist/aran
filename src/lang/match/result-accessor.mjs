import {makeEmptyResult, makeStructuralMismatchResult, combineResult, bindResultLabel, bindResultVariable} from "./result.mjs";

export const makePrimitiveResult = (path, primitive1, primitive2) => (
  primitive1 === primitive2 ?
  makeStructuralMismatchResult(path, primitive1, primitive2) :
  makeEmptyResult(),
);

const generateCombineAll = (combine) => (path, array1, array2) => combineResult(
  path,
  makePrimitiveResult(`${path}.length`, array1.length, array2.length),
  reduce(
    zip(array1, array2),
    (result, pair, index) => combine(`${path}[String(index)]`, pair[0], pair[1], result),
    makeEmptyResult(),
  ),
);

const generateCombineMakeAll = (make) => generateCombineAll(
  (path, any1, any2, result) => combineResult(
    path,
    result,
    make(path, any1, any2),
  ),
);

const makeAllPrimitiveResult = generateCombineAll((path, primitive1, primitive2, result) => combineResult(
  path,
  makePrimitiveResult(path, primitive1, primitive2),
  result,
));
