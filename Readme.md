# co-nested-hbs

Generator-based Handlebars templates for nested layouts.

[koa-hbs](https://github.com/jwilm/koa-hbs) is really great, but doesn't support nested layouts. Adding nested layouts to koa-hbs would unfortunately be a complete rewrite.

co-nested-hbs supports (nested) layouts, helpers, and partials.

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
  var html = yield view.render('home', 'simple_theme', 'overall_layout', {title: 'Hello World!'});
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
  var view = require('co-nested-hbs')('view_path/goes/here', {
    layout: 'layout_file', // specify implied layout (or layouts) to be added to each render() call.
    partialsPath: 'path_to_partials',
    cache: true
  });

  // single template rendering
  var html = yield view.render('template', {local: 'variable'});

  // register helper
  view.registerHelper('link-to', function(url, text) {
    return "<a href='" + this.url + "'>" + this.text + "</a>";
  });

  // render the following templates in a chain, building the 'nest'
  var html = yield view.render('first_render', 'second_render', 'third_render');

  // locals can be applied to all templates when they are rendered
  var html = yield view.render('first_render', 'second_render', 'third_render', {title: 'Hello World!'}, {global_local: 'applied to all templates'});
}
```

# License

  MIT
