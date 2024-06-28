try {
  throw null;
} catch (f) {
  // var f = 123;
  function f() {
    return 123;
  }
}

((f) => {
  console.log("before outer", f);
  {
    console.log("before inner", f);
    function f() {}
    console.log("after inner", f);
  }
  console.log("after outer", f);
})(123);

(() => {
  var f = 123;
  console.log("before outer", f);
  {
    console.log("before inner", f);
    function f() {}
    console.log("after inner", f);
  }
  console.log("after outer", f);
})();

(() => {
  let f = 123;
  console.log("before outer", f);
  {
    console.log("before inner", f);
    function f() {}
    console.log("after inner", f);
  }
  console.log("after outer", f);
})();
