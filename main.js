// !! Node must be called from aran directory !!
// Don't use the same name for in.html and out.html !!
// usage: node aran.js linvail.js 1< in.html 1> out.html
// The linvail file should populate the aran object:
//   a) Literals:      window.aran.literals.{number|string|regex|array|object|function}
//   b) Operations:    window.aran.operations.{plus|minus|...}
//   c) Global object: window.aran.shadows.{document|XMLHttpRequest|...}
// N.B. It is the user responsability to compile with window.aran.eval any js code
// that fly in the system (e.g. window.eval, window.document.createElement("script"))

var fs = require("fs")
var htmlparser = require("htmlparser2")

if (process.argv.length !== 3) {
  throw new Error("Usage: node main.js options.js 1< in.html 1> out.html")
}

var esprima = fs.readFileSync("esprima.js").toString()
var escodegen = fs.readFileSync("escodegen.browser.js").toString()
var miley = fs.readFileSync("miley.js").toString()
var options = fs.readFileSync(process.argv[2]).toString()
var aran = fs.readFileSync("aran.js").toString()

var out = process.stdout
var is_js = false

process.stdin.pipe(new htmlparser.Parser({
  onopentag: function(tag, attrs) {
    open_tag(tag, attrs)
    if (tag === "script") {
      if (attrs.src) {
        out.write("aran.load(\"")
        out.write(attrs.src)
        out.write("\", ")
        out.write(attrs.async)
        out.write(")")
      } else {
        is_js = true
        out.write("aran.compile(\"")
      }
    } else if (tag === "html") {
      out.write("<script>")
      out.write(js_escape(esprima))
      out.write(js_escape(escodegen))
      out.write(js_escape(miley))
      out.write("window.aran={};\n")
      out.write(js_escape(options))
      out.write(js_escape(aran))
      out.write("</script>")
    }
  },
  // text nodes are not decoded (&lt; does not become <)
  ontext: function(text) {
    if (is_js) { text = string_escape(js_escape(text)) }
    out.write(text)
  },
  onclosetag: function(tag) {
    if (tag === "script") {
      is_js = false
      out.write("\")")
    }
    close_tag(tag)
  }
}))

function open_tag (tag, attrs) {
  out.write("<"+tag)
  for (var attr in attrs) {
    out.write(" ")
    out.write(attr)
    out.write("=\"")
    // attributes are not decoded (&lt; does not become <)
    out.write(attrs[attr])
    out.write("\"")
  }
  out.write(">")
}

function close_tag (tag) {
  out.write("</")
  out.write(tag)
  out.write(">")
}

function js_escape (str) {
  // </script> can only occurs within string litteral and comments
  // as "</script>" and "<\/script>" evaluate to the same string
  // the semantic is preserved
  return str.replace(/<\/script>/g, "<\\/script>")
}

function string_escape (str) {
  return str.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\n")
}
