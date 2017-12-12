

// function (keyss, object) {
//   while (object) {
//     keyss[keyss.length] = Object.keys(object);
//     object = Object.getPrototypeOf(object);
//   }
//   return Reflect.apply(Array.prototype.concat, [], keyss);
// }

module.exports = () => Build.closure(
  null,
  ["object"],
  [
    ARAN.cut.while(
      ARAN.cut.copy0.before(
        Build.read("object")),
      [
        ARAN.cut.set(
          ARAN.cut.copy1.before(
            Build.read("keyss")),
          ARAN.cut.get(
            ARAN.cut.copy1.before(
              Build.read("keyss")),
            ARAN.cut.primitive("length")),
          ARAN.cut.apply(
            ARAN.cut.protect("Object.keys"),
            null,
            [
              ARAN.cut.copy0(
                Build.read("object"))])),
        Build.write(
          "object",
          ARAN.cut.apply(
            ARAN.cut.protect("Object.getPrototypeOf"),
            null,
            [
              Build.read("object")]))]),
    ARAN.cut.Drop(),
    Build.Return(
      ARAN.cut.apply(
        ARAN.cut.protect("Reflect.apply"),
        null,
        [
          ARAN.cut.protect("concat"),
          ARAN.cut.array(),
          Build.read("keyss")]))]);
