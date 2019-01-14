module.exports = (instrument) => (path, script, argv) => new Worker(URL.createObjectURL(new Blob([
  "console.log = function () { \n",
  "  postMessage(Array.from(arguments).map(String).join(' ')+'\\n');\n",
  "};\n",
  "this.eval("+instrument+"("+JSON.stringify(script)+"));"
])));
