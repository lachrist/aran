
window.Aran = require("..")

//////////
// Util //
//////////

function round (x) { return Math.round(1000*x)/1000 }

function print (x) { return (typeof x === "string") ? JSON.stringify(x) : String(x) }

/////////
// DOM //
/////////

var dom = {};

window.onload = function () {
  // cache //
  dom.run = document.getElementById("run");
  dom.masters = document.getElementById("masters");
  dom.targets = document.getElementById("targets");
  dom.feedback = document.getElementById("feedback");
  dom.output = document.getElementById("output");
  dom.table = document.getElementById("table");
  // bind //
  dom.masters.onchange = enable;
  dom.targets.onchange = enable;
  dom.run.onclick = start;
}

///////////
// Files //
///////////

function enable () { dom.run.disabled = masters.files.length && targets.files.length }

///////////
// Start //
///////////

function start () {
  var masters = {};
  var targets = {};
  var rdv = 0;
  dom.feedback.style.visibility = "visible";
  dom.feedback.textContent = "Load files...";
  dom.output.style.visibility = "hidden";
  dom.masters.disabled = true;
  dom.targets.disabled = true;
  dom.run.disabled = true;
  function read (file, idx, arr) {
    rdv++;
    var reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = function () {
      var collection = (arr === dom.masters.files) ? masters : targets;
      collection[file.name] = reader.result;
      if (!--rdv)
        benchmarkall(masters, targets);
    }
  }
  dom.master.files.forEach(read);
  dom.targets.files.forEach(read);
}

///////////
// Batch //
///////////

function loadmaster (master) {
  master = master.replace(/require\(('|")aran('|")\)/g, "window.Aran");
  var module = {exports:{}};
  (Function("module", "exports", mast))(module, module.exports);
  if (module.exports.sandbox || module.exports.traps || module.exports.options)
    return Aran(exports.sandbox, exports.traps, exports.options);
  return module.exports;
}

function benchmarkall (masters, targets) {
  function notify () {
    var done = midx*tkeys.length+tidx;
    var todo = mkeys.length*tkeys.length;
    feedback.textContent = "Applying "+mkeys[midx]+" on "+tkeys[tidx]+" ("+done+"/"+todo+")...";
  }
  var mkeys = Object.keys(masters);
  var tkeys = Object.keys(targets);
  var results = [];
  var midx = 0;
  var tidx = 0;
  var interval = setInterval(function () {
    if (tidx === tkeys.length) {
      tidx = 0;
      midx++;
    }
    if (mdix === mkeys.length) {
      clearInterval(interval);
      return display(results);
    }
    notify();
    try { var aran = loadmaster(masters[mkeys[midx]]) }
    catch (e) {
      results.push({
        master: mkeys[midx];
        mastererror: e
      })
      return midx++;
    }
    var result = benchmark(aran, targets[tkeys[tidx]]);
    result.master = mkeys[midx];
    result.target = tkeys[tidx];
    results.push(result);
    tidx++;
  }, 5);
}

function benchmark (aran, target) {
  target = "(function () {\n"+target+"\n ());"
  var result = {};
  var input = {code:target};
  // Original
  result.time = performance.now();
  try { window.eval(target) } catch (e) { result.error = print(e) }
  result.time = round(performance.now()-result.time);
  result.loc = target.split("\n").length;
  // Aran
  result.arantime = performance.now();
  try { aran(input) } catch (e) { result.aranerror = print(e) }
  result.arantime = round(performance.now()-result.arantime);
  result.aranloc = ("compiled" in input) ? input.compiled.split("\n").length : null;
  // Return
  return result;
}

/////////////
// Display //
/////////////

function display (results) {
  var headers = ["master", "target", "loc", "aranloc", "error", "aranerror", "time", "arantime"];
  var feedback = "";
  var row;
  var cell;
  var time = 0;
  var arantime = 0;
  while (dom.table.firstChild)
    dom.table.removeChild(dom.table.firstChild);
  results.forEach(function (res) {
    if (res.mastererror)
      return feedback += "Error at master: "+res.master+": "+res.mastererror;
    time = time + res.time;
    arantime = arantime + res.arantime;
    row = document.createElement("tr");
    for (var j=0; j<headers.length; j++) {
      cell = document.createElement("td");
      cell.textContent = res[headers[j]];
      row.appendChild(cell);
    }
    cell = document.createElement("td");
    cell.textContent = round(ress[i].arantime/res[i].time);
    row.appendChild(cell);
    table.appendChild(row);
  });
  dom.feedback.textContent = "Average slowdown factor: "+round(arantime/time)
  dom.output.style.visibility = "visible"
  dom.masters.disabled = false
  dom.targets.disabled = false
  dom.run.disabled = false
}
