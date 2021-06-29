var assert = require('assert');

var co = require('co');

// preload
require('..')('test');

it('allows for different partials with the same name across different partialPaths', async function () {
  var view1 = require('..')('test');
  var view2 = require('..')('test_instances');

  var html1 = await view1.render('partial', { world: 'world' });
  assert.equal(html1, 'hello partial world\n');
  var html2 = await view2.render('partial');
  assert.equal(html2, 'hello partial with different view path\n');
});

describe('view.render', function () {
  it('nests output', async function () {
    var view = require('..')('test'),
      html = await view.render('c', 'b', 'a');

    assert.equal(html, '<a><b>c\n</b>\n</a>\n');
  });

  it('a layout can be specified', async function () {
    var view = require('..')('test', { layout: 'test/a' }),
      html = await view.render('c');

    assert.equal(html, '<a>c\n</a>\n');
  });

  it('multiple layouts can be specified', async function () {
    var view = require('..')('test', { layouts: ['test/b', 'test/a'] }),
      html = await view.render('c');

    assert.equal(html, '<a><b>c\n</b>\n</a>\n');
  });

  it('accepts locals which are then applied to every template', async function () {
    var view = require('..')('test'),
      html = await view.render('locals', { world: 'world' });

    assert.equal(html, 'hello world\n');
  });

  it('accepts locals and render options', async function () {
    var view = require('..')('test'),
      html = await view.render('locals', { world: 'world' }, { layout: false });

    assert.equal(html, 'hello world\n');
  });

  it('finds and renders partials', async function () {
    var view = require('..')('test');

    var html = await view.render('partial', { world: 'world' });

    assert.equal(html, 'hello partial world\n');
  });

  it('registers and uses helpers', async function () {
    var html,
      view = require('..')('test');

    view.registerHelper('link-to', function (text, url) {
      return '<a href="' + url + '">' + text + '</a>';
    });

    html = await view.render('helper');
    assert.equal(html, 'hello <a href="http://www.world.com/">world</a>\n');
  });

  it('takes a last argument to disable the global layouts', async function () {
    var view = require('..')('test', { layout: 'a' }),
      html = await view.render('c', {}, { layout: false });

    assert.equal(html, 'c\n');
  });

  it('takes a last argument to choose a new layout', async function () {
    var view = require('..')('test', { layout: 'test/a' }),
      html = await view.render('c', {}, { layout: 'test/b' });

    assert.equal(html, '<b>c\n</b>\n');
  });

  it('ignores a null layout', async function () {
    var view = require('..')('test', { layout: 'test/a' }),
      html = await view.render('c', {}, { layout: null });

    assert.equal(html, '<a>c\n</a>\n');
  });
});
