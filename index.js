var fs = require('fs');
var path = require('path');
var readdirp = require('readdirp');

// thunk
var read = function (filename) {
  return function(done) {
    fs.readFile(filename, {encoding: 'utf8'}, done);
  };
};

function registerPartials(partialsPath, handlebars) {
  var stream = readdirp({root: partialsPath, fileFilter: '_*.hbs'});

  stream
    .on('warn', function (err) {
      console.error('non-fatal error', err);
    })
    .on('error', function (err) { console.error('fatal error', err); })
    .on('data', function (entry) {
      // TODO: how to get rid of this readFileSync?
      var rawTemplate = fs.readFileSync(entry.fullPath, {encoding: 'utf8'});
      handlebars.registerPartial(path.basename(entry.name, '.hbs').substring(1), rawTemplate);
    });
}

module.exports = function(viewPath, opts) {
  opts = opts || {};
  opts.partialsPath = opts.partialsPath || viewPath;
  opts.cache = opts.cache || true;

  var hbs = {};

  hbs.handlebars = require('handlebars').create();

  registerPartials(opts.partialsPath, hbs.handlebars);

  hbs.registerHelper = function() {
    hbs.handlebars.registerHelper.apply(hbs.handlebars, arguments);
  };

  hbs.cache = {};

  hbs.render = function *(tmpl, locals) {
    if (!tmpl.endsWith('.hbs')) {
      tmpl = tmpl + '.hbs';
    }
    locals = locals || {};

    if(!hbs.cache[tmpl]) {
      var rawTemplate = yield read(path.join(viewPath, tmpl));
      hbs.cache[tmpl] = hbs.handlebars.compile(rawTemplate);
    }

    return hbs.cache[tmpl](locals);
  };

  hbs.renderAll = function *renderAll (arr) {
    var buffer=null,
      i, len, tmpl, locals;

    for(i = 0, len = arr.length; i < len; i++) {
      tmpl = arr[i][0];
      locals = arr[i][1] || {};

      locals.body = buffer;

      buffer = yield hbs.render(tmpl, locals);
    }

    return buffer;
  };

  return hbs;
};
