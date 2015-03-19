var x = new AranProxy(1, {
  binary: function (op, x, y) {
    console.log("Binary: "+x+" "+op+" "+y)
    return 666
  },
  apply: function (fct, th, args) {
    console.log("Apply: "+fct)
    return args.join("-") 
  }
})

if (x+2 !== 666) { throw "fail1" }
if (3+x !== 666) { throw "fail2" }
if (x(1,2,3) !== "1-2-3") { throw "fail2" }
