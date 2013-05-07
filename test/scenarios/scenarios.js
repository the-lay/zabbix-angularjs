'use strict';

describe('Zabbix Frontend', function() {

  describe('Actions before logging in', function() {

    describe('Trying to access controllers without authentication', function() {

      it('it should redirect you to login page, because you are unlogged', function() {
        browser().navigateTo('/');
        expect(browser().location().url()).toBe('/login');
      });

      //check for access to other controllers without authorization
      it('it should automatically redirect to /login/ from / without auth', function() {
        browser().navigateTo('/');
        expect(browser().location().url()).toBe('/login');
      });

      it('it should automatically redirect to /login/ from /servers/ without auth', function() {
        browser().navigateTo('/#/servers/');
        expect(browser().location().url()).toBe('/login');
      });

      it('it should automatically redirect to /login/ from /servers/10148 without auth', function() {
        browser().navigateTo('/#/servers/101148/');
        expect(browser().location().url()).toBe('/login');
      });

      it('it should automatically redirect to /login/ from /project/ without auth', function() {
        browser().navigateTo('/#/project');
        expect(browser().location().url()).toBe('/login');
      });

      it('it should automatically redirect to /login/ from /project/24 without auth', function() {
        browser().navigateTo('/#/project/24/');
        expect(browser().location().url()).toBe('/login');
      });

      it('it should automatically redirect to /login/ from /dashboard/ without auth', function() {
        browser().navigateTo('/#/dashboard/');
        expect(browser().location().url()).toBe('/login');
      });

       it('it should automatically redirect to /login/ from /search/ without auth', function() {
        browser().navigateTo('/#/search');
        expect(browser().location().url()).toBe('/login');
      });

       it('it should automatically redirect to /login/ from /search/something without auth', function() {
        browser().navigateTo('/#/search/something');
        expect(browser().location().url()).toBe('/login');
      });

    });

    /**
    * Test cases for Login controller.
    */
    describe('Trying to log in', function() {

      beforeEach(function() {
        browser().navigateTo('/');
      });

      it('it should not login without entering password', function() {
        input('inputName').enter('totallyFakeAndNotRealUsername');
        expect(element('input.ng-invalid.ng-invalid-required', 'Helper Password').count()).toBe(1);
      });

      it('it should not login without entering username', function() {
        input('inputPassword').enter('totallyFakeAndNotRealPassword');
        expect(element('input.ng-invalid.ng-invalid-required', 'Helper Username').count()).toBe(1);
      });

      it('it should not login with bad username and password', function() {
        input('inputName').enter('totallyFakeAndNotRealUsername');
        input('inputPassword').enter('totallyFakeAndNotRealPassword');
        element('button.btn').click();
        expect(element('span.help-block', 'Error Span Helper').text()).toEqual('Login name or password is incorrect.');
      });

      it('it should login correctly and automatically redirect you to overview', function() {
        browser().navigateTo('/');
        input('inputName').enter('frontend');
        input('inputPassword').enter('frontend');
        element('button.btn').click();
        expect(browser().location().url()).toBe('/');
      });

    });

  });

  describe('Actions after logging in', function() {

    /**
    * Test cases for Overview controller.
    */
    describe('Overview controller', function() {

      beforeEach(function() {
        browser().navigateTo('/');
      });

      it('it should be able to see more than null server groups', function() {
        expect(element('tr').count()).toBeGreaterThan(0);
      });

      it('it should be able to show errors', function() {
        //let's be honest, there is always at least one minor warning in the system
        //so we can test for this
        expect(element('td').text()).toMatch('error');
      });

      it('it should be able to open error details overview', function() {
        //let's be honest, there is always at least one minor warning in the system
        //so we can test for this
        element('a.underlined').click();
        expect(element('tr.errorsOverview:visible').count()).toBeGreaterThan(0);
      });

      it('it should redirect you to project overview', function() {
        element('a.ng-binding').click();
        expect(browser().location().url()).toMatch('/project/');
      });

    });

    /**
    * Test cases for Servers controller.
    */
    describe('Servers controller', function() {

      /**
      * Test cases for Servers controller without specific servers.
      */
      describe('Visiting /servers without specific server', function() {

        beforeEach(function() {
          browser().navigateTo('/#/servers/');
        });

        it('it should show at least one server in total overview', function() {
          expect(element('tr.ng-scope:visible').count()).toBeGreaterThan(1);
        });

        it('it should redirect to server details', function() {
          element('a.ng-binding').click();
          expect(browser().location().url()).toMatch('/servers');
        });

        it('it should show current Zabbix agent status', function() {
          expect(element('td.error0').count()).toBeGreaterThan(0);
        });

        it('it should successfully filter the server list', function() {
          input('filterString').enter('Zabbix server');
          expect(element('tr.ng-scope:visible').count()).toBe(1);
        });

      });

      /**
      * Test cases for Servers controller with specific server selected.
      */
      describe('Visiting specific server overview', function() {

        beforeEach(function() {
          browser().navigateTo('/#/servers/10084');
        });

        it('it should show current server statistics', function() {
          expect(element('caption').text()).toMatch('Current statistics');
          expect(element('tr.currentStats').count()).toBeGreaterThan(0);
        });

        it('it should show current server host inventory', function() {
          expect(element('caption').text()).toMatch('Inventory info');
          expect(element('tr.inventoryInfo').count()).toBeGreaterThan(0);
        });

      });

    });

    /**
    * Test cases for Dashboard controller.
    */
    describe('Dashboard controller', function() {

      beforeEach(function() {
        browser().navigateTo('/#/dashboard/');
      });

      it('it should show at least one server', function() {
        expect(element('a.serverLink:visible').count()).toBeGreaterThan(0);
      });

      it('it should hide all servers', function() {
        element('#groups a').click();
        expect(element('a.serverLink:visible').count()).toBe(0);
      });

      it('it should hide and then show groups selector', function() {
        expect(element('#groups:visible').count()).toBe(1);
        element('#toggleGroups').click();
        sleep(1);
        expect(element('#groups:visible').count()).toBe(0);
        element('#toggleGroups').click();
        sleep(1);
        expect(element('#groups:visible').count()).toBe(1);
      });

    });

    /**
    * Test cases for Search controller.
    */
    describe('Search controller', function() {

      it('it should redirect to /search/query from overview', function() {
        browser().navigateTo('/');
        input('searchQuery').enter('query');
        element('button.btn').click();
        expect(browser().location().url()).toMatch('/search/query');
      });

      it('it should give a lot of results on /search/ace', function() {
        input('searchQuery').enter('ace');
        element('button.btn').click();
        expect(browser().location().url()).toMatch('/search/ace');
        expect(element('a.foundHosts').count()).toBeGreaterThan(1);
        expect(element('a.foundHostgroups').count()).toBeGreaterThan(1);
      });

      it('it should redirect to server details page', function() {
        element('li.ng-scope:first-child a.foundHosts').click();
        expect(browser().location().url()).toMatch('/servers/');
      });

    });

    /**
    * Test cases for Project controller.
    */
    describe('Project controller', function() {

      it('it should redirect to the main page after going to /project without specific ID', function() {
        browser().navigateTo('/#/project/');
        expect(browser().location().url()).toBe('/');
      });

      it('it should show servers of that project', function() {
        browser().navigateTo('/#/project/24');
        expect(element('tr.ng-scope:visible').count()).toBeGreaterThan(1);
      });

      it('it should successfully filter the server list', function() {
        browser().navigateTo('/#/project/24');
        input('filterString').enter('ace-billing-qaapp1');
        expect(element('tr.ng-scope:visible').count()).toBe(1);
      });

    });

    /**
    * Test cases for Logout controller.
    */
    describe('logging out', function() {
      it('it should log out of the system', function() {
        browser().navigateTo('/#/logout/');
        //after logging out navigating to main page
        browser().navigateTo('/');
        //if I am guest I would see /login
        expect(browser().location().url()).toBe('/login');
      });
    });

  });

});

/**
* UserParameter=ping[*],FOR /F "tokens=5 delims==<ms" %i IN ('ping -n 1 -4 $1 ^|find "Reply from"') DO @echo %i
*/