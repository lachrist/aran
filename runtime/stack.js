
// Setup runtime stack to provide temporary memory, defines:
//   - aran.push{1,2,3}
//   - aran.get{1,2,3}
//   - aran.pop{1,2,3}
//   - aran.mark
//   - aran.unmark
//   - aran.flush

module.exports = function (aran) {

  var marks = []
  var stack = []
  var stack1 = []
  var stack2 = []
  var stack3 = []

  aran.push  = function (x) { return (stack .push(x), x) }
  aran.push1 = function (x) { return (stack1.push(x), x) }
  aran.push2 = function (x) { return (stack2.push(x), x) }
  aran.push3 = function (x) { return (stack3.push(x), x) }

  aran.pop  = function () { return stack .pop() }
  aran.pop1 = function () { return stack1.pop() }
  aran.pop2 = function () { return stack2.pop() }
  aran.pop3 = function () { return stack3.pop() }

  aran.get  = function () { return stack [stack .length-1] }
  aran.get1 = function () { return stack1[stack1.length-1] }
  aran.get2 = function () { return stack2[stack2.length-1] }
  aran.get3 = function () { return stack3[stack3.length-1] }

  aran.mark = function () {
    var mark = {}
    marks.push(mark)
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

  aran.flush = function () {
    while (marks.pop());
    while (stack.pop());
    while (stack1.pop());
    while (stack2.pop());
    while (stack3.pop());
  }

}
