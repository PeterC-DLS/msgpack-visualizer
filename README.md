# Msgpack Visualizer

This is a fork of a msgpack visualizer that
[@sugendran](https://github.com/sugendran/) wrote. His original code can be
found [here](https://github.com/sugendran/msgpack-visualizer).

Differences in this fork:

* Add support for parsing array notation (`[1, 2, 254, 255]`)
* Add support for parsing hexarray notation (`[01, 02, fe, ff]`)
* Load initial data from hash parameter (`#base64=<data>` or `#array=<data>`)
* Extract stylesheets and scripts from index.html into separate files
* Some CSS tweaks

You can find a hosted version at https://msgpack.dbrgn.ch/.

## Parameters

If you want to pass in the initial data through the URL, append
`#base64=<data>`, `#array=<data>` or `#hexarray=<data>` to the URL, where
`<data>` is the URL encoded data string that should end up in the input field.


# MIT LICENSE

Copyright (C) 2012-2017 Sugendran Ganess
Copyright (C) 2017-2018 Danilo Bargen

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
