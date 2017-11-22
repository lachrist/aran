
module.exports = (nfo, nid) => {
  const tag = ARAN_NAMESPACE + "_" + nid + "_" + nfo;
  if (!ARAN_HIDDEN.includes(tag))
    ARAN_HIDDEN.push(tag);
  return tag;
};
