var fs = require('fs');
var path = require('path');
var glob = require('glob');

var handlebars = require('handlebars').create();

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

function* registerPartials(partialsPath) {
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

var registeredPartials = false;

function* renderTemplate(viewPath, partialsPath, tmpl, locals) {
  if (!registeredPartials) {
    yield registerPartials(partialsPath);
    registeredPartials = true;
  }

  if (!tmpl.endsWith('.hbs')) {
    tmpl = tmpl + '.hbs';
  }

  if(!hbsCache[tmpl]) {
    var rawTemplate = yield read(path.join(viewPath, tmpl));
    hbsCache[tmpl] = handlebars.compile(rawTemplate);
  }

  return hbsCache[tmpl](locals);
}

module.exports = function(viewPath, opts) {
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
    var buffer=null, lastArg, secondToLastArg, renderViewPath,
      renderOpts, locals, templates, i, len, tmpl;

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

    if (renderOpts.layout !== false) {
      templates = templates.concat(hbs.layouts);
    }

    renderViewPath = renderOpts.viewPath || viewPath;

    for(i = 0, len = templates.length; i < len; i++) {
      tmpl = templates[i];

      locals.body = buffer;

      buffer = yield renderTemplate(renderViewPath, opts.partialsPath, tmpl, locals);
    }

    return buffer;
  };

  return hbs;
};
