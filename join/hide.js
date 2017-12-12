
module.exports = (information) => {
  const identifier = ARAN.namespace + "_" + ARAN.index + "_" + information;
  if (!ARAN.closure.hidden.includes(identifier))
    ARAN.closure.hidden.push(identifier);
  return identifier;
};
