
window.Aran = require("..")

window.onload = function () {
  document.getElementById("masters").onchange = checkfiles
  document.getElementById("targets").onchange = checkfiles
  document.getElementById("run").onclick = pre
}

function prepare () {
  var exports = {}
  eval(arguments[0])
  return Aran(exports.sandbox, exports.hooks, exports.traps)
}

function print (x) {
  if (x === undefined) { return "undefined" }
  try { return JSON.stringify(x) } catch (e) { return String(e) }
}

function checkefiles () {
  document.getElementById("run").disabled =
    !(document.getElementById("masters").files.length || document.getElementById("targets").files.length)
}

function pre () {
  document.getElementById("output-div").visibility = "hidden"
  document.getElementById("progress-span").visibility = "visible"
  document.getElementById("masters").disabled = true
  document.getElementById("targets").disabled = true
  document.getElementById("run").disabled = true
  var masters = {}
  var targets = {}
  var rdv = 0
  function populate (obj) {
    return function (file) {
      rdv++
      var reader = new FileReader()
      reader.readAsText(file, "UTF-8")
      reader.onload = function () {
        obj[file.name] = reader.result
        if (!--rdv) { benchmarkall(masters, targets) }
      }
    }
  }
  document.getElementById("masters").files.forEach(populate(masters))
  document.getElementById("targets").files.forEach(populate(targets))
}

function benchmarkall (masters, targets) {
  var masterkeys = Object.keys(masters)
  var targetkeys = Object.keys(targets)
  var results = []
  var i=0
  var j=0
  function update (done) { document.getElementById("progress-span").textContent = "["+done+"/"+(masterkeys.length*targetkeys.length)+"]" }
  update(0)
  var interval = setInterval(function () {
    if (j === targetkeys.length) { (j = 0, i++) }
    if (i === masterkeys.length) { return (clearInterval(interval), post(results)) }
    var result = run(masters[masterkeys[i]], targets[targetkeys[j]])
    result.master = masterkeys[i]
    result.target = targetkeys[j]
    results.push(result)
    j++
    update(i*masterkeys.length+j)
  }, 5)
}

function benchmark (master, target) {
  var result = {}
  var input = {code:target}
  var aran = prepare(master)
  // Original
  result.time = performance.now()
  result.result = window.eval(target)
  result.time = result.time - performance.now()
  result.time = String(Math.round(1000*result.time)/1000)
  result.result = print(result.result)
  result.loc = targets[targetkeys[i]].split("\n").length
  // Aran
  result.arantime = performance.now()
  result.aranresult = aran(input)
  result.arantime = result.arantime - performance.now()
  result.arantime = String(Math.round(1000*result.arantime)/1000)
  result.aranresult = print(result.aranresult)
  result.aranloc = input.compiled.split("\n").length
  // Return
  return result
}

function post (results) {
  var headers = ["master", "target", "time", "arantime", "result", "aranresult", "error", "aranerror", "loc", "aranloc"]
  var table = document.getElementById("output-table")
  var row
  var cell
  document.getElementById("output-json").textContent = JSON.stringify(results)
  while (table.firstChild) { table.removeChild(table.firstChild) }
  for (var i=0; i<results.length; i++) {
    row = document.createElement("tr") 
    for (var j=0; j<headers.length; i++) {
      cell = document.createElement("td")
      cell.textContent = results[i][headers[j]]
      row.appendChild(cell)
    }
    table.appendChild(row)
  }
  document.getElementById("progress-span").visibility = "hidden"
  document.getElementById("output-div").style.visibility = "visible"
  document.getElementById("masters").disabled = false
  document.getElementById("targets").disabled = false
  document.getElementById("run").disabled = false
}
