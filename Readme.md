# co-nested-hbs

Generator-based Handlebars templates for nested layouts.

[koa-hbs](https://github.com/jwilm/koa-hbs) is really great, but doesn't support nested layouts. Adding nested layouts to koa-hbs would unfortunately be a complete rewrite.

co-nested-hbs supports layouts, helpers, and partials.

## Installation

```
$ npm install co-nested-hbs
```

## Example

views/overall_layout.hbs

    <html>
      <head>
        <title>{{title}}</title>
      </head>
      <body>
        {{{body}}}
      </body>
    </html>

views/simple_theme.hbs

    <header>
      Simple Theme!
    </header>

    <div class="simple_theme">
      {{{body}}}
    </div>

    <footer>
      Footer!
    </footer>

views/home.hbs

    <p>Welcome {{name}}!<p>


```js
var r = require('rethinkdb');
var co = require('co');
var view = require('co-nested-hbs');

co(function *() {
  var html = yield view.renderAll([
    ['home', {name: 'Bob'}],
    ['simple_theme'],
    ['overall_layout', {title: 'Hello World!'}]
  ]);
})();
```

html output would be:

    <html>
      <head>
        <title>Hello World!</title>
      </head>
      <body>
        <header>
          Simple Theme!
        </header>

        <div class="simple_theme">
          <p>Welcome Bob!<p>
        </div>

        <footer>
          Footer!
        </footer>
      </body>
    </html>

## Usage

Partials are automatically registered if their filename matches `_*.hbs`, directory is ignored.

```js
function *() {
  var view = require('co-nested-hbs')('view_path/goes/here');

  // single template rendering
  var html = yield view.render('template', {local: 'variable'});

  // register helper
  view.registerHelper('link-to', function(url, text) {
    return "<a href='" + this.url + "'>" + this.text + "</a>";
  });

  // render the following templates in a chain, building the 'nest'
  var html = yield view.renderAll([
    ['first_render', {name: 'Bob'}],
    ['second_render'], // {{{body}}} here will refer to the first_render html output
    ['third_render', {title: 'Hello World!'}] // {{{body}}} here will refer to the second_render html output. voila, nesting.
  ]);
}
```

# License

  MIT
