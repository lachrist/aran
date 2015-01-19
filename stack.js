
module.exports = function (aran) {

  var marks = []
  var stack = []
  var stack1 = []
  var stack2 = []
  var stack3 = []

  aran.push = function (x) { return stack.push(x) }
  aran.push1 = function (x) { return stack1.push(x) }
  aran.push2 = function (x) { return stack2.push(x) }
  aran.push3 = function (x) { return stack3.push(x) }

  aran.pop = function () { return stack.pop() }
  aran.pop1 = function () { return stack1.pop() }
  aran.pop2 = function () { return stack1.pop() }
  aran.pop3 = function () { return stack1.pop() }

  aran.get = function () { return stack[stack1.length] }
  aran.get1 = function () { return stack1[stack1.length] }
  aran.get2 = function () { return stack2[stack2.length] }
  aran.get3 = function () { return stack2[stack2.length] }

  aran.mark = function () {
    var mark = marks.push({})
    stack.push(mark)
    stack1.push(mark)
    stack2.push(mark)
    stack3.push(mark)
  }

  aran.unmark = function () {
    var mark = marks.pop()
    while (stack.pop() !== mark);
    while (stack1.pop() !== mark);
    while (stack2.pop() !== mark);
    while (stack3.pop() !== mark);
  }

}
