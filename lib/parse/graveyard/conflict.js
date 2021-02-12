"use strict";

const checkUnique = (identifier, index, identifiers) => Throw.assert(
  ArrayLite.indexOf(identifiers, identifier) === index,
  null,
  `Duplicate rigid declaration of variable named ${identifier}`);

exports.checkConflict = (variables) => (
  _identifiers1 = ArrayLite.map(
    ArrayLite.filter(result.variables, isRigidVariable),
    getName),
  ArrayLite.forEach(_identifiers1, checkUnique),
  _identifiers2 = ArrayLite.map(
    ArrayLite.filter(result.variables, isLooseVariable),
    getName),
  ArrayLite.forEach(
    _identifiers2,
    (idenifier) => Throw.assert(
      !ArrayLite.includes(_identifiers1, identifier),
      null,
      `Duplicate loose declaration of variable named ${identifier}`));

