"use strict";

{
  TryStatement: (node) => (
}






exports.combine = (result1, result2) => ({
  variables: ArrayLite.concat(result1.variables, result2.variables),
  hoisting: ArrayLite.concat(result1.hoisting, result2.hoisting),
  evals: 
});

// exports.hoistRigid = () => {};
// 
// exports.hoistLoose = () => {};

exports.hoistBlock = (result, node, _variables) => (
  // console.assert(ArrayLite.every(ArrayLite.filterOut(result.variables, isBlockVariable), isLooseVariable))
  // _variables = ArrayLite.filter(result.variables, isBlockVariable),
  _identifiers1 = ArrayLite.map(ArrayLite.filter(_variables, isRigidVariable), getName),
  _identifiers2 = ArrayLite.map(ArrayLite.filter(_variables, isLooseVariable), getName),
  ArrayLite.forEach(_identifiers1, checkUnique),
  ArrayLite.forEach(
    _identifiers2,
    (identifier) => ArrayLite.assert(
      !ArrayLite.includes(_identifiers1, identifier),
      null,
      `Duplicate loose variable named ${identifier}`)),
  {
    variables: ArrayLite.filterOut(result.variables, isBlockVariable),
    hoisting: ArrayLite.concat(result.hoisting, [[node, _variables]]),
    scoping: ArrayLite.
  

exports.hoistClosure = (result, node) => {};

exports.hoistRigidCatchBlock = (result, node, identifier) => {};

exports.hoistLooseCatchBlock = (result, node, identifiers) => {};

exports.hoist = (result, node, predicate) => (
  ({
  variables: ArrayLite.filterOut(result.variables, predicate),
  hoisting: ArrayLite.concat(
    result1.hoisting,
    [
      [
        node,
        ArrayLite.filter(result.variables, predicate)]]),
  scoping: ArrayLite.map(
    node.scoping,
    ({0:key, 1:value}) => [
      key,
      ArrayLite.concat(value, [node])])});

const scope = (variables) => ArrayLite.map(
  ArrayLite.filter(variables, isRigidVariable),
  getName);

const conflict = (identifiers1, identifiers2) => ArrayLite.forEach(
  identifiers1,
  (identifier) => Throw.assert(
    !ArrayLite.includes(identifiers2, identifier),
    null,
    `Duplicate declaration of variable named ${identifier}`));



// conflict = (variables, _identifiers1, _identifiers2) => (
//   identifiers1 = ArrayLite.filter(variables, isLooseVariable),
//   identifiers2 = ArrayLite.filter(variables, isRigidVariable),
// 