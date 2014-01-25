var fs = require('fs');
var path = require('path');
var extend = require('xtend');
var glob = require('glob');

// thunk!
function read(filePath) {
  return function(done) {
    fs.readFile(filePath, {encoding: 'utf8'}, done);
  };
}

// thunk!
function findPartialTemplateFiles(partialsPath) {
  return function(done) {
    glob(path.join(partialsPath, '**/_*.hbs'), done);
  };
}

function* registerPartials(partialsPath, handlebars) {
  var i, len, files, filePath, partialName, rawTemplate;

  files = yield findPartialTemplateFiles(partialsPath);

  for(i = 0, len = files.length; i < len; i++) {
    filePath = files[i];
    rawTemplate = yield read(filePath);
    partialName = path.basename(filePath, '.hbs').substring(1);

    handlebars.registerPartial(partialName, rawTemplate);
  }
}

module.exports = function(viewPath, opts) {
  opts = opts || {};
  opts.partialsPath = opts.partialsPath || viewPath;
  opts.cache = opts.cache || true;
  opts.layouts = opts.layouts || [];

  if(!(opts.layouts instanceof Array)) {
    opts.layouts = [opts.layouts];
  }

  var hbs = {layouts: opts.layouts, registeredPartials: false};

  hbs.handlebars = require('handlebars').create();

  hbs.registerHelper = function() {
    hbs.handlebars.registerHelper.apply(hbs.handlebars, arguments);
  };

  hbs.cache = {};

  hbs.render = function *(tmpl, locals) {
    if (!hbs.registeredPartials) {
      yield registerPartials(opts.partialsPath, hbs.handlebars);
      hbs.registeredPartials = true;
    }

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

  hbs.renderAll = function *renderAll (arr, globalLocals) {
    var buffer=null,
      i, len, tmpl, locals;

    globalLocals = globalLocals || {};

    arr = arr.concat(hbs.layouts);

    for(i = 0, len = arr.length; i < len; i++) {
      tmpl = arr[i][0];
      locals = arr[i][1] || {};

      locals.body = buffer;

      buffer = yield hbs.render(tmpl, extend(globalLocals, locals));
    }

    return buffer;
  };

  return hbs;
};
