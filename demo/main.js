
window.Aran = require("..")

// <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.1.8/ace.js"></script>
function print (x) {
  if (x === undefined) { return "undefined" }
  try { return JSON.stringify(x) } catch (e) { return String(e) }
}

var master
var target
var compiled

function editor (id) {
  var editor = ace.edit(id)
  editor.setTheme("ace/theme/chrome")
  editor.getSession().setMode("ace/mode/javascript")
  editor.$blockScrolling = Infinity
  editor.setOption("showPrintMargin", false)
  editor.getSession().setTabSize(2)
  editor.getSession().setUseSoftTabs(true)
  return editor
}

window.onload = function () {
  master = editor("master")
  target = editor("target")
  compiled = editor("compiled")
  compiled.setReadOnly(true)
  setInterval(function () {
    master.resize()
    target.resize()
    compiled.resize()
  }, 1000)
  for (var name in masters) {
    var option = document.createElement("option")
    option.textContent = name
    option.value = name
    document.getElementById("select").appendChild(option)
  }
  document.getElementById("select").onchange = function () { master.setValue(masters[select.value], -1) }
  document.getElementById("select").value = "Empty"
  master.setValue(masters.Empty, -1)
  document.getElementById("init").onclick = run
}

function run () {
  document.getElementById("output-div").style.visibility = "hidden"
  compiled.setValue("", -1)
  var module = {exports:{}}
  try { (Function("module", "exports", master.getValue().replace(/require\(('|")aran('|")\)/, "window.Aran")))(module, module.exports) }
  catch (e) { throw (alert("Error when running master: "+e), e) }
  var aran = module.exports
  if (typeof module.exports !== "function")
    try { aran = Aran(module.exports.sandbox, module.exports.traps, module.exports.options) }
    catch (e) { throw (alert("Error when setting up Aran: "+e),e) }
  document.getElementById("run").disabled = false
  document.getElementById("run").onclick = function () {
    var comparison = document.getElementById("comparison").checked
    // Hide old results
    document.getElementById("output-div").style.visibility = "hidden"
    // Run original
    if (comparison) {
      var start = performance.now()
      try { var result = window.eval(target.getValue()) } catch (e) { var error = e }
      var end = performance.now()
    }
    // Run Aran
    var input = {code:target.getValue()}
    var aranstart = performance.now()
    try { var aranresult = aran(input) } catch (e) { var aranerror = e }
    var aranend = performance.now()
    // Output results
    compiled.setValue(input.compiled, -1)
    document.getElementById("result").textContent = comparison ? String(result) : ""
    document.getElementById("error").textContent = comparison ? String(error) : ""
    document.getElementById("time").textContent = comparison ? ((Math.round(1000*(end-start))/1000)+"ms") : ""
    document.getElementById("aran-result").textContent = String(aranresult)
    document.getElementById("aran-error").textContent = String(aranerror)
    document.getElementById("aran-time").textContent = (Math.round(1000*(aranend-aranstart))/1000)+"ms"
    document.getElementById("output-div").style.visibility = "visible"
    // Throws error for debugging purpose
    if (error) { throw (console.dir(error), error) }
    if (aranerror) { throw (console.dir(aranerror), aranerror) }
  }
}
