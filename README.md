Aran
====

Aran is an extensive JavaScript instrumenter that aims to be complient to the entire ECMAScript5 specification.
Command line usage usage (requires node.js and the htmlparser2 npm module):
    ```node main.js ./samples/options.js < ./samples/in.html > ./samples/out.html```
This line will transform the specified HTML file so that any JavaScript code incoming to the web page is instrumented first.



Aran can also be explored 

Proxy usage
-----------
* With statement (eg: with({a:1}) {var b=a})
* For-in loop with object as left part (eg: for (var o1.a in o2) {})
* Window object: if proxies are supported the window accessed by the client code is a proxy that automatically escape identifier ; if proxies are not supported the marker aran.swindow is given instead.

