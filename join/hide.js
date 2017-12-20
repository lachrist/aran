
const ArrayLite = require("array-lite"); 

module.exports = (information) => {
  const identifier = ARAN.namespace + "_" + ARAN.index + "_" + information;
  if (!ArrayLite.includes(ARAN.context.hidden, identifier))
    ARAN.context.hidden[ARAN.context.hidden.length] = identifier;
  return identifier;
};
