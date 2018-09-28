
const Object_assign = Object.assign;

module.exports = (format) => {
  const copy = Object_assign({}, format);
  delete copy.get;
  delete copy.set;
  delete copy.unary;
  delete copy.binary;
  delete copy.array;
  delete copy.regexp;
  delete copy.object;
  delete copy.save;
  delete copy.load;
  return copy;
};
