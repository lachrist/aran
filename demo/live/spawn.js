(instrument) => (path, script, argv) => new Worker(URL.createObjectURL(new Blob([
  "console.log = function () { \n",
  "  postMessage(Array.from(arguments).map(String).join(' ')+'\\n');\n",
  "};\n",
  "const instrumented = "+instrument+"("+JSON.stringify(script)+");\n",
  // Uncomment to log instrumented code
  // "console.log(instrumented);\n",
  "this.eval(instrumented);"
])));