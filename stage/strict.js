
/*
 * UseStrict statements are simply ignored for the moment.
 */

module.exports = function (next) {

  function stmt (type, stmt) {
    if (type === "UseStrict") {
      type = "Empty"
      stmt.type = "EmptyStatement"
    }
    return next.stmt(type, stmt)
  }

  return {prgm:next.prgm, stmt:stmt, expr:next.expr}

}


