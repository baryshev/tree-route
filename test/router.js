var assert = require('assert')
var Router = require('../lib/router');

var router = new Router();
describe('Router', function () {
    router.addRoute(['GET'], '/', 'handler0');

    it('should find existed route', function () {
        var result = router.dispatch('GET', '/');
        assert.equal('handler0', result['handler']);
    });

    it('should return 404 error for not existed route', function () {
        var result = router.dispatch('GET', '/not/existed/url');
        assert.equal(404, result['error']['code']);
    });

    it('should return 405 error for unsupported method', function () {
        var result = router.dispatch('POST', '/');
        assert.equal(405, result.error.code);
        assert.deepEqual(['GET'], result['allowed']);
    });

    it('should define route with short methods', function () {
        router.post('/create', 'handler1');
        var result = router.dispatch('POST', '/create');

        assert.equal('handler1', result['handler']);
    });

    it('should extract route params', function () {
        router.get('/news/{id}', 'handler2');
        var result = router.dispatch('GET', '/news/1');

        assert.equal('handler2', result['handler']);
        assert.equal('1', result['params']['id']);
    });

    it('should match regexp in params', function () {
        router.get('/users/{name:[a-zA-Z]+}', 'handler3');
        router.get('/users/{id:[0-9]+}', 'handler4');

        var result = router.dispatch('GET', '/users/@test');
        assert.equal(404, result['error']['code']);

        var result = router.dispatch('GET', '/users/bob');
        assert.equal('handler3', result['handler']);
        assert.equal('bob', result['params']['name']);

        var result = router.dispatch('GET', '/users/123');
        assert.equal('handler4', result['handler']);
        assert.equal('123', result['params']['id']);
    });

    it('should give greater priority to statically defined route', function () {
        router.get('/users/help', 'handler5');
        var result = router.dispatch('GET', '/users/help');
        assert.equal('handler5', result['handler']);
        assert.deepEqual({}, result['params']);
    });

    it('should save and restore routes', function () {
        var routes = router.getRoutes();
        router = new Router();
        var result = router.dispatch('GET', '/');
        assert.equal(404, result['error']['code']);
        router.setRoutes(routes);
        var result = router.dispatch('GET', '/');
        assert.equal('handler0', result['handler']);
    });

    it('should ignore query string if it exists', function () {
        var result = router.dispatch('GET', '/news/1?page=2');
        assert.equal('handler2', result['handler']);
        assert.equal('1', result['params']['id']);
    });

    it('should know allowed methods', function () {
        var result = router.getOptions('/news/1?page=2');
        assert.deepEqual(['GET'], result);
        var result = router.getOptions('/notExistedRoute');
        assert.deepEqual(null, result);
    });
});