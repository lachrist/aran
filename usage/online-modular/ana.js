var Aran = require('../../main.js');
	window.__hidden__ = {};
	window.__hidden__.NrOfScripts = 0; 
	window.__hidden__.ScriptsObj = {}; // register all scripts
	window.__hidden__.Program = null;
	window.__hidden__.FunctionDefinitions = new WeakMap();


	module.exports = function (code, url) {  // this is actually my instrument function (this is wat i should export)
		// window.__hidden__.Program = ast;
		console.log("Script: ", url);
		window.__hidden__.NrOfScripts++; // new encountered script
		var Script = {}; // object for script
		// Script.startline = ast.bounds[0];
		// Script.endline = ast.bounds[1];
		console.log("Script ",window.__hidden__.NrOfScripts);
		// console.log("Start: ", ast.bounds[0]);
		// console.log("End: ", ast.bounds[1]);
		// Memory usage
		Script.ArrayCreations = 0;	
		Script.ObjectCreations = 0;
		// CPU usage
		Script.FunctionCalls = 0; 
		Script.TestCases = 0; 
		// Network usage
		Script.XMLrequests = 0;
		Script.URL = url;
		return aran.instrument(code, Script);
	}



// xmlhttprequest

	window.__hidden__.apply = function(fct, ths, args, idx) {
		var script = get(idx);
		if (fct === XMLHttpRequest.prototype.send) {
			console.log("BOAAAAA")
		}

		if (fct === WebSocket.prototype.send) {
			console.log("BEEEEUUU")
		}

		script.FunctionCalls++; // always accounted for

		// var AllScripts = window.__hidden__.ScriptsObj;
		// for(var url in AllScripts) {
		// 	if (AllScripts.hasOwnProperty(url)) {
		// 		var Script = AllScripts[url];
		// 		if (Script.startline <= idx && idx <= Script.endline) {
		// 			Script.FunctionCalls++;
		// 			// this is too check if the called function was defined inside
		// 			// var t = window.__hidden__.FunctionDefinitions.get(fct); //get back script where it was defined
		// 			// if (typeof t != 'undefined' && t != url) { //if it's not the same, it's a function from a different script
		// 			// 	console.log("False", t, " ////// ", url);
		// 			// }
		// 			break;
		// 		}
		// 	}
		// };
		calls.push(url);
		try {
			var result = fct.apply(ths, args);
		} 
		finally {
			calls.pop();
		}
		return result;
		//return fct.apply(ths, args);
	};

	var top = calls.length - 1;
	var cost = 100;
	for (i = top; i > 0; i--) {
		var url = calls[i];
		var script = AllScripts[url];
		script.ObjectCreations += cost;
		cost /= 2;
	}


// chck for function,log weakmap function -> url to know which function is created in which url
// Array.isArray
// primitive, array, function, object
	window.__hidden__.literal = function(val, idx) {
		if (typeof val === 'function') {
			var script = get(idx);
			var url = script.URL;
			window.__hidden__.FunctionDefinitions.set(val, url);
		}


		// 	for (var url in AllScripts) {
		// 		if (AllScripts.hasOwnProperty(url)) {
		// 			var Script = AllScripts[url];
		// 			if (Script.startline <= idx && idx <= Script.endline) {
		// 				window.__hidden__.FunctionDefinitions.set(val, url); //log definition of function + origin script
		// 				break;
		// 			}
		// 		}
		// 	};
		// }

		if (typeof val === 'object') {
			var script = get(idx);
			if(Array.isArray(val)) {
				Script.ArrayCreations++;
				}
			else {
				Script.ObjectCreations++;
				// var top = calls.length - 1;
				// var cost = 100;
				// for (i = top; i > 0; i--) {
				// 	var url = calls[i];
				// 	var script = AllScripts[url];
				// 	script.ObjectCreations += cost;
				// 	cost /= 2;
				}
			}
		
		return val;
	};


	window.__hidden__.test = function(val, idx) {
		var testcase = aran.search(idx);
		if (typeof testcase == 'undefined') return val;
		var AllScripts = window.__hidden__.ScriptsObj;
		var cost = 0;
		switch (testcase.type) {
			case "ForStatement":
				cost = 1;
				break;
			case "IfStatement":
				cost = 1;
				break;

			case "WhileStatement":
				cost = 1;
				break;

			case "ForInStatement":
				cost = 1;
				break;
		}
		var script = get(idx);
		//for (var script = testcase; script.parent; script = script.parent); // at the end i have the correct script
		script.TestCases += cost;
		// for (var url in AllScripts) {
		// 	if (AllScripts.hasOwnProperty(url)) {
		// 		var Script = AllScripts[url];
		// 		if (Script.startline <= idx && idx <= Script.endline) {
		// 			Script.TestCases += cost;
		// 			break;
		// 		}
		// 	}
		// }
		return val;
	};

 // function search (ast, idx) {
 //    var tmp;
 //    if (typeof ast !== "object" || ast === null)
 //      return;
 //    if (ast.bounds && idx === ast.bounds[0])
 //      return ast;
 //    if (ast.bounds && (idx < ast.bounds[0] || idx > ast.bounds[1]))
 //      return;
 //    for (var k in ast)
 //      if (tmp = search(ast[k], idx))
 //        return tmp;
 //  }

 function get(idx) {
 	var node = aran.search(idx);
 	for (var root = node; root.parent; root = root.parent);
 	return root;
 }

 var aran = Aran({namespace: "__hidden__", traps:Object.keys(__hidden__), loc:true});






