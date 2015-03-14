
var hooks = new Proxy({}, {
  get: function (_, type) {
    return function () {
      var msg = 'hooks.'+type;
      for (var i=0; i<arguments.length; i++) { msg = msg+' '+arguments[i] }
      console.log(msg)
    }
  }
});
