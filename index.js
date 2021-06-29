var fs = require('fs').promises;
var path = require('path');
var globby = require('globby');
var Handlebars = require('handlebars');

async function read(filePath) {
  return await fs.readFile(filePath, { encoding: 'utf8' });
}

async function findPartialTemplateFiles(partialsPath) {
  return await globby(path.join(partialsPath, '**/_*.hbs'));
}

async function registerPartials(handlebars, partialsPath) {
  var i, len, files, filePath, partialName, rawTemplate;

  files = await findPartialTemplateFiles(partialsPath);

  for (i = 0, len = files.length; i < len; i++) {
    filePath = files[i];
    rawTemplate = await read(filePath);
    partialName = path.basename(filePath, '.hbs').substring(1);
    handlebars.registerPartial(partialName, rawTemplate);
  }
}

var hbsCache = {};

var registeredPartialPaths = {};

async function renderTemplate(handlebars, tmpl, locals) {
  if (!tmpl.endsWith('.hbs')) {
    tmpl = tmpl + '.hbs';
  }

  if (!hbsCache[tmpl]) {
    var rawTemplate = await read(tmpl);
    hbsCache[tmpl] = handlebars.compile(rawTemplate);
  }

  return hbsCache[tmpl](locals);
}

module.exports = function (viewPath, opts) {
  var handlebars = Handlebars.create();

  opts = opts || {};
  opts.partialsPath = opts.partialsPath || viewPath;
  opts.cache = opts.cache || true;
  if (opts.layout) {
    opts.layouts = [opts.layout];
  } else {
    opts.layouts = opts.layouts || [];
  }

  if (!(opts.layouts instanceof Array)) {
    opts.layouts = [opts.layouts];
  }

  var hbs = { layouts: opts.layouts, handlebars: handlebars };

  hbs.registerHelper = function () {
    handlebars.registerHelper.apply(handlebars, arguments);
  };

  hbs.render = async function () {
    var buffer = null,
      lastArg,
      secondToLastArg,
      renderOpts,
      locals,
      templates,
      i,
      len,
      tmpl;

    if (opts.partialsPath && !registeredPartialPaths[opts.partialsPath]) {
      await registerPartials(handlebars, opts.partialsPath);
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

    templates = templates.map(function (tmpl) {
      return path.join(viewPath, tmpl);
    });

    if (renderOpts.layout !== false) {
      if (renderOpts.layout) {
        templates = templates.concat([renderOpts.layout]);
      } else {
        templates = templates.concat(hbs.layouts);
      }
    }

    for (i = 0, len = templates.length; i < len; i++) {
      tmpl = templates[i];

      locals.body = buffer;

      buffer = await renderTemplate(handlebars, tmpl, locals);
    }

    return buffer;
  };

  return hbs;
};
