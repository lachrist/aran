(instrument) => (path, script, argv) => new Worker(URL.createObjectURL(new Blob([
  "this.eval("+instrument+"("+JSON.stringify(script)+"));\n",
])));