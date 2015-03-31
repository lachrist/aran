
window.Aran = require("..")

function print (x) {
  if (x === undefined) { return "undefined" }
  try { return JSON.stringify(x) } catch (e) { return String(e) }
}

window.onload = function () {
  for (var name in masters) {
    var option = document.createElement("option")
    option.textContent = name
    option.value = name
    document.getElementById("select").appendChild(option)
  }
  document.getElementById("select").onchange = function () { master.value = masters[select.value] }
  document.getElementById("select").value = "Empty"
  document.getElementById("master").value = masters.Empty
  document.getElementById("init").onclick = run
}

function run () {
  document.getElementById("output-div").style.visibility = "hidden"
  document.getElementById("compiled").value = ""
  var exports = {}
  try { eval(document.getElementById("master").value) } catch (e) { throw (alert("Error when running master: "+e), e) }
  try { var aran = Aran(exports.sandbox, exports.traps) } catch (e) { throw (alert("Error when setting up Aran: "+e),e) }
  document.getElementById("run").disabled = false
  document.getElementById("run").onclick = function () {
    // Hide old results
    document.getElementById("output-div").style.visibility = "hidden"
    // Run original
    if (document.getElementById("comparison").checked) {
      var start = performance.now()
      try { var result = window.eval(target.value) } catch (e) { var error = e }
      var end = performance.now()
    }
    // Run Aran
    var input = {code:target.value}
    var aranstart = performance.now()
    try { var aranresult = aran(input) } catch (e) { var aranerror = e }
    var aranend = performance.now()
    // Output results
    document.getElementById("compiled").value = input.compiled
    document.getElementById("result").textContent = String(result)
    document.getElementById("error").textContent = String(error)
    document.getElementById("time").textContent = (Math.round(1000*(end-start))/1000)+"ms"
    document.getElementById("aran-result").textContent = String(aranresult)
    document.getElementById("aran-error").textContent = String(aranerror)
    document.getElementById("aran-time").textContent = (Math.round(1000*(aranend-aranstart))/1000)+"ms"
    document.getElementById("output-div").style.visibility = "visible"
    // Throws error for debugging purpose
    if (error) { throw (console.dir(error), error) }
    if (aranerror) { throw (console.dir(aranerror), aranerror) }
  }
}
