(analysis) => (path, script, argv) => new Worker(URL.createObjectURL(new Blob([
  analysis+"("+JSON.stringify(path)+", "+JSON.stringify(script)+", postMessage);"
])));