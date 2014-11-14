Aran
====

Aran is an extensive JavaScript instrumenter that aims to be complient to the entire ECMAScript5 specification.
Usage:
    node main.js ./samples/options.js < ./samples/in.html > ./samples/out.html

Proxy usage
-----------
* With statement (eg: with({a:1}) {var b=a})
* For-in loop with object as left part (eg: for (var o1.a in o2) {})
* Window object: if proxies are supported the window accessed by the client code is a proxy that automatically escape identifier ; if proxies are not supported the marker aran.swindow is given instead.

TODO
----
* Update statements (eg: x++, o[k]++, --x, etc)
* Assignment operators (eg: x+=1)
* The evil eval function
