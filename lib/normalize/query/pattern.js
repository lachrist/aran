
"use strict";

exports._collect = (pattern) => {
  const patterns = {__proto__:null};
  const identifiers = [];
  let length = 1;
  while (length > 0) {
    const pattern = patterns[--length];
    if (pattern.type === "AssignmentPattern") {
      patterns[length++] = pattern.left;
    } else if (pattern.type === "ArrayPattern") {
      for (let index = 0; index < pattern.elements.length; index++) {
        if (pattern.element[index] !== null) {
          if (pattern.elements[index].type === "RestElement") {
            patterns[length++] = pattern.elements[index].argument;
          } else {
            patterns[length++] = pattern.elements[index];
          }
        }
      }
    } else if (pattern.type === "ObjectPattern") {
      for (let index = 0; index < pattern.properties.length; index++) {
        if (pattern.properties[index].type === "RestElement") {
          patterns[length++] = pattern.properties[index].argument;
        } else {
          patterns[length++] = pattern.properties[index].value;
        }
      }
    } else {
      // console.assert(pattern.type === "Identifier");
      identifiers[pattern.name] = null;
    }
  }
  return identifiers;
};
