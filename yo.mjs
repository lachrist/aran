const fs = [];
for (let x = 0; x < 10; x += 1) {
  fs.push(() => ({ x }));
}
for (const f of fs) {
  console.log(f());
}

{
  let x, y, _x, _y, _test;
  x = 123;
  y = 456;
  _x = x;
  _y = y;
  _first = true;
  _test = true;
  while (_first || _test) {
    let x, y;
    x = _x;
    y = _y;
    _first ? (first = false) : (x += 1);
    _test = x < 10;
    if (_test) {
      fs.push(() => ({ x, y }));
    }
    _x = x;
    _y = y;
  }
}
