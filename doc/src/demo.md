---
layout: default-title
title: Live Demo
---

Beside performance overhead, Aran has some known issues that may cause instrumented programs to no behave as their pre-instrumented version. Most of these issues requires fairly convoluted code to arise.

{% assign demos = site.demos | sort: 'order' %}
{% for demo in demos %}
- [{{ demo.title }}]({{ demo.url }})
{% endfor %}
