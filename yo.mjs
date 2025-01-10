
const state = 123;
{
  const old_state = state;
  {
    const state = extend(old_state);
  }
}


const state = 123;
const old_state = state;
{

}

{
  const state1 = extend(state2);
  {
    const state2 = extend(state1);
  }
}

{
  const state123 = extends(122);
  const state = state123;
  eval("state");
  
}