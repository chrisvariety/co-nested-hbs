var assert = require('assert');

var co = require('co');

// preload
require('..')('test')

it('allows for different partials with the same name across different partialPaths', function(done) {
  co(function *() {
    var view1 = require('..')('test');
    var view2 = require('..')('test_instances');

    var html1 = yield view1.render('partial', {world: 'world'});
    assert.equal(html1, 'hello partial world\n\n');
    var html2 = yield view2.render('partial');
    assert.equal(html2, 'hello partial with different view path\n\n');
  })(done);
});

describe('view.render', function() {
  it('nests output', function(done) {
    co(function *() {
      var view = require('..')('test'),
        html = yield view.render('c', 'b', 'a');

      assert.equal(html, '<a><b>c\n</b>\n</a>\n');
    })(done);
  });

  it('a layout can be specified', function(done) {
    co(function *() {
      var view = require('..')('test', {layout: 'test/a'}),
        html = yield view.render('c');

      assert.equal(html, '<a>c\n</a>\n');
    })(done);
  });

  it('multiple layouts can be specified', function(done) {
    co(function *() {
      var view = require('..')('test', {layouts: ['test/b', 'test/a']}),
        html = yield view.render('c');

      assert.equal(html, '<a><b>c\n</b>\n</a>\n');
    })(done);
  });

  it('accepts locals which are then applied to every template', function(done) {
    co(function *() {
      var view = require('..')('test'),
        html = yield view.render('locals', {world: 'world'});

      assert.equal(html, 'hello world\n');
    })(done);
  });

  it('accepts locals and render options', function(done) {
    co(function *() {
      var view = require('..')('test'),
        html = yield view.render('locals', {world: 'world'}, {layout: false});

      assert.equal(html, 'hello world\n');
    })(done);
  });

  it('finds and renders partials', function(done) {
    co(function *() {
      var view = require('..')('test');

      var html = yield view.render('partial', {world: 'world'});

      assert.equal(html, 'hello partial world\n\n');
    })(done);
  });

  it('registers and uses helpers', function(done) {
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

  it('takes a last argument to disable the global layouts', function(done) {
    co(function *() {
      var view = require('..')('test', {layout: 'a'}),
        html = yield view.render('c', {}, {layout: false});

      assert.equal(html, 'c\n');
    })(done);
  });

  it('takes a last argument to choose a new layout', function(done) {
    co(function *() {
      var view = require('..')('test', {layout: 'test/a'}),
        html = yield view.render('c', {}, {layout: 'test/b'});

      assert.equal(html, '<b>c\n</b>\n');
    })(done);
  });

  it('ignores a null layout', function(done) {
    co(function *() {
      var view = require('..')('test', {layout: 'test/a'}),
        html = yield view.render('c', {}, {layout: null});

      assert.equal(html, '<a>c\n</a>\n');
    })(done);
  });

});
