var fs = require('fs');
var path = require('path');
var glob = require('glob');
var Handlebars = require('handlebars');

function read(filePath) {
  return function(done) {
    fs.readFile(filePath, {encoding: 'utf8'}, done);
  };
}

function findPartialTemplateFiles(partialsPath) {
  return function(done) {
    glob(path.join(partialsPath, '**/_*.hbs'), done);
  };
}

function *registerPartials(handlebars, partialsPath) {
  var i, len, files, filePath, partialName, rawTemplate;

  files = yield findPartialTemplateFiles(partialsPath);

  for(i = 0, len = files.length; i < len; i++) {
    filePath = files[i];
    rawTemplate = yield read(filePath);
    partialName = path.basename(filePath, '.hbs').substring(1);
    handlebars.registerPartial(partialName, rawTemplate);
  }
}

var hbsCache = {};

var registeredPartialPaths = {};

function *renderTemplate(handlebars, tmpl, locals) {
  if (!tmpl.endsWith('.hbs')) {
    tmpl = tmpl + '.hbs';
  }

  if(!hbsCache[tmpl]) {
    var rawTemplate = yield read(tmpl);
    hbsCache[tmpl] = handlebars.compile(rawTemplate);
  }

  return hbsCache[tmpl](locals);
}

module.exports = function(viewPath, opts) {
  var handlebars = Handlebars.create();

  opts = opts || {};
  opts.partialsPath = opts.partialsPath || viewPath;
  opts.cache = opts.cache || true;
  if (opts.layout) {
    opts.layouts = [opts.layout];
  } else {
    opts.layouts = opts.layouts || [];
  }

  if(!(opts.layouts instanceof Array)) {
    opts.layouts = [opts.layouts];
  }

  var hbs = {layouts: opts.layouts, handlebars: handlebars};

  hbs.registerHelper = function() {
    handlebars.registerHelper.apply(handlebars, arguments);
  };

  hbs.render = function* () {
    var buffer=null, lastArg, secondToLastArg,
      renderOpts, locals, templates, i, len, tmpl;

    if (opts.partialsPath && !registeredPartialPaths[opts.partialsPath]) {
      yield registerPartials(handlebars, opts.partialsPath);
      registeredPartialPaths[opts.partialsPath] = true;
    }

    lastArg = arguments[arguments.length - 1];
    secondToLastArg = arguments[arguments.length - 2];

    if (typeof secondToLastArg === 'object') {
      // both renderOpts and locals given
      renderOpts = lastArg;
      locals = secondToLastArg;
      templates = Array.prototype.slice.call(arguments, 0, -2);
    } else if (typeof lastArg === 'object') {
      // just locals given
      renderOpts = {};
      locals = lastArg;
      templates = Array.prototype.slice.call(arguments, 0, -1);
    } else {
      // neither renderOpts nor locals given
      renderOpts = {};
      locals = {};
      templates = Array.prototype.slice.call(arguments);
    }

    templates = templates.map(function(tmpl) {
      return path.join(viewPath, tmpl);
    });

    if (renderOpts.layout !== false) {
      if (renderOpts.layout) {
        templates = templates.concat([renderOpts.layout]);
      } else {
        templates = templates.concat(hbs.layouts);
      }
    }

    for(i = 0, len = templates.length; i < len; i++) {
      tmpl = templates[i];

      locals.body = buffer;

      buffer = yield renderTemplate(handlebars, tmpl, locals);
    }

    return buffer;
  };

  return hbs;
};
