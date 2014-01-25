var assert = require('assert');

var co = require('co');

// preload
require('..')('test');

describe('view.render', function() {
  it('returns html with locals filled in', function(done) {
    co(function *() {
      var view = require('..')('test'),
        html = yield view.render('locals', {world: 'world'});

      assert.equal(html, 'hello world\n');
    })(done);
  });

  it('returns html with partials', function(done) {
    co(function *() {
      var view = require('..')('test');

      var html = yield view.render('partial', {world: 'world'});

      assert.equal(html, 'hello partial world\n\n');
    })(done);
  });

  it('returns html with a helper', function(done) {
    co(function *() {
      var html,
        view = require('..')('test');

      view.registerHelper('link-to', function(text, url) {
        return '<a href="' + url + '">' + text + '</a>';
      });

      html = yield view.render('helper');
      assert.equal(html, 'hello <a href="http://www.world.com/">world</a>\n');
    })(done);
  });

  it('caches templates', function(done) {
    co(function *() {
      var view = require('..')('test');
      yield view.render('a');
      assert(view.cache['a.hbs'], 'template is cached');
    })(done);
  });
});

describe('view.renderAll', function() {
  it('nests output', function(done) {
    co(function *() {
      var view = require('..')('test'),
        html = yield view.renderAll([
          ['c'],
          ['b'],
          ['a']
        ]);

      assert.equal(html, '<a><b>c\n</b>\n</a>\n');
    })(done);
  });

  it('each template can have locals', function(done) {
    co(function *() {
      var view = require('..')('test'),
        html = yield view.renderAll([
          ['locals', {world: 'world'}],
          ['a']
        ]);

      assert.equal(html, '<a>hello world\n</a>\n');
    })(done);
  });

  it('a layout can be specified', function(done) {
    co(function *() {
      var view = require('..')('test', {layouts: 'a'}),
        html = yield view.renderAll([
          ['locals', {world: 'world'}]
        ]);

      assert.equal(html, '<a>hello world\n</a>\n');
    })(done);
  });

  it('multiple layouts can be specified', function(done) {
    co(function *() {
      var view = require('..')('test', {layouts: ['b', 'a']}),
        html = yield view.renderAll([
          ['c']
        ]);

      assert.equal(html, '<a><b>c\n</b>\n</a>\n');
    })(done);
  });

  it('accepts global locals applied to every template', function(done) {
    co(function *() {
      var view = require('..')('test'),
        html = yield view.renderAll([
          ['locals']
        ], {world: 'world'});

      assert.equal(html, 'hello world\n');
    })(done);
  });

  it('locals override global locals', function(done) {
    co(function *() {
      var view = require('..')('test'),
        html = yield view.renderAll([
          ['locals', {world: 'worldy'}]
        ], {world: 'world'});

      assert.equal(html, 'hello worldy\n');
    })(done);
  });
});
