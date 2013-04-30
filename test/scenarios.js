'use strict';

describe('application', function() {

  beforeEach(function() {
    browser().navigateTo('/');

  });

  it('it should automatically redirect to /login', function() {
    expect(browser().location().url()).toBe('/login/');
  });

  it('test scenario', function() {
    expect(browser().location().url()).not('/404');
  });

});
