
// A very strict sandbox that only whitelist Math and JSON //

exports.sandbox = {
  Math:Math,
  JSON:JSON
}

// aran.sandbox = window
// window.aran.sandbox = window
// function f () { this.alert("BOUM") }
// f()
