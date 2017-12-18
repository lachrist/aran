 
module.exports = (information) => {
  const identifier = ARAN.namespace + "_" + ARAN.index + "_" + information;
  if (!ARAN.context.hidden.includes(identifier))
    ARAN.context.hidden.push(identifier);
  return identifier;
};
