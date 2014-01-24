var assert = require('assert');

var view = require('..')('test');
var co = require('co');

describe('view.render', function() {
  it('returns html with locals filled in', function(done) {
    co(function *() {
      var html = yield view.render('locals', {world: 'world'});
      assert.equal(html, 'hello world\n');
    })(done);
  });

  it('returns html with partials', function(done) {
    co(function *() {
      var html = yield view.render('partial', {world: 'world'});
      assert.equal(html, 'hello partial world\n\n');
    })(done);
  });

  it('returns html with a helper', function(done) {
    co(function *() {
      view.registerHelper('link-to', function(text, url) {
        return '<a href="' + url + '">' + text + '</a>';
      });

      var html = yield view.render('helper');
      assert.equal(html, 'hello <a href="http://www.world.com/">world</a>\n');
    })(done);
  });
});

describe('view.renderAll', function() {
  it('nests output', function(done) {
    co(function *() {
      var html = yield view.renderAll([
        ['c'],
        ['b'],
        ['a']
      ]);
      assert.equal(html, '<a><b>c\n</b>\n</a>\n');
    })(done);
  });

  it('each template can have locals', function(done) {
    co(function *() {
      var html = yield view.renderAll([
        ['locals', {world: 'world'}],
        ['a']
      ]);
      assert.equal(html, '<a>hello world\n</a>\n');
    })(done);
  });
});
