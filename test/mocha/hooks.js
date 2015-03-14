
var Aran = require("..")
var Assert = require("assert")

describe("hooks-type", function () {

  function get (target, type) { return function () { target.push(type) } }

  it("should stacks types for '1+2;'", function (done) {
    var types = []
    var aran = Aran(new Proxy(types, {get:get}))
    aran("1+2;")
    Assert.deepEqual(types, ["Program", "Expression", "Binary", "Literal", "Literal"])
    done()
  })

})
