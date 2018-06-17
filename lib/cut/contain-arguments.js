
const Error = global.Error;

module.exports = (patterns) => {
  let index1 = 0;
  for (let index1 = 0; index1 < patterns.length; index1++) {
    const pattern = patterns[index1];
    if (pattern.type === "Identifier") {
      if (pattern.name === "arguments")
        return true;
    } else if (pattern.type === "RestElement") {
      patterns[patterns.length] = pattern.argument;
    } else if (pattern.type === "AssignmentPattern") {
      patterns[patterns.length] = pattern.left;
    } else if (pattern.type === "ArrayPattern") {
      for (let index2=0, length2=pattern.elements.length; index2<length2; index2++)
        if (pattern.elements[index2])
          patterns[patterns.length] = pattern.elements[index2];
    } else if (pattern.type === "ObjectPattern") {
      for (let index2=0, length2=patterns.properties.length; index2<length2; index2++)
        patterns[patterns.length] = pattern.properties[index2].value;
    } else {
      throw new Error("Unknown pattern type: "+pattern.type);
    }
  }
  return false;
};
