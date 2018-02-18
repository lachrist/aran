(analysis) =>
  (path, script, argv) =>
    new Worker(URL.createObjectURL(new Blob([
      analysis+"("+JSON.stringify(script)+")"
    ])));