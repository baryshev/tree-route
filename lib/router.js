(function () {
    'use strict';
    var methods = ['options', 'get', 'head', 'post', 'put',  'delete', 'trace', 'connect'];
    var separatorRegExp = /^[\s\/]+|[\s\/]+$/g;
    var paramsRegExp = /^{((([^:]+):(.+))|(.+))}$/;

    var createMethodHandler = function (method) {
        method = method.toUpperCase();
        return function () {
            for (var i = 0; i < arguments.length - 1; i++) {
                this.addRoute(method, arguments[i], arguments[arguments.length - 1]);
            }
        };
    };

    var match = function (url, routes) {
        var parts = url.split('?', 1)[0].replace(separatorRegExp, '').split('/');
        if (parts.length === 1 && parts[0] === '') {
            parts = [];
        }
        var params = {};
        var current = routes;

        parts:
            for (var i = 0; i < parts.length; i++) {
                if (current.childs[parts[i]]) {
                    current = current.childs[parts[i]];
                } else {
                    for (var regexp in current.regexps) {
                        if (parts[i].match(current.regexps[regexp].regexp)) {
                            current = current.regexps[regexp];
                            params[current.name] = parts[i];
                            continue parts;
                        }
                    }
                    if (current.others) {
                        current = current.others;
                        params[current.name] = parts[i];
                    } else {
                        return null;
                    }
                }
            }

        if (!current.methods) {
            return null;
        } else {
            return {
                methods: current.methods,
                route: current.route,
                params: params
            };
        }
    };

    var getMethods = function (route) {
        var methods = [];
        for (var method in route.methods) {
            methods.push(method);
        }
        return methods;
    };

    var Router = function () {
        this.routes = {childs: {}, regexps: {}};
    };

    Router.prototype.addRoute = function (methods, route, handler) {
        if (typeof methods === 'string') {
            methods = [methods];
        }

        var parts = route.split('?', 1)[0].replace(separatorRegExp, '').split('/');
        if (parts.length === 1 && parts[0] === '') {
            parts = [];
        }

        var current = this.routes;
        parts.forEach(function (part) {
            var paramsMatch = part.match(paramsRegExp);
            if (paramsMatch) {
                if (paramsMatch[2]) {
                    if (!current.regexps[paramsMatch[4]]) {
                        current.regexps[paramsMatch[4]] = {
                            childs: {},
                            regexps: {},
                            name: paramsMatch[3],
                            regexp: new RegExp(paramsMatch[4])
                        };
                    }
                    current = current.regexps[paramsMatch[4]];
                } else {
                    if (!current.others) {
                        current.others = {childs: {}, regexps: {}, name: paramsMatch[5]};
                    }
                    current = current.others;
                }
            } else {
                if (!current.childs[part]) {
                    current.childs[part] = {childs: {}, regexps: {}};
                }
                current = current.childs[part];
            }
        });

        current.route = route;
        methods.forEach(function (method) {
            if (!current.methods) {
                current.methods = {};
            }
            current.methods[method.toUpperCase()] = handler;
        });
    };

    Router.prototype.dispatch = function (method, url) {
        var route = match(url, this.routes);

        if (!route) {
            return {
                error: {
                    code: 404,
                    message: 'Not Found'
                },
                method: method,
                url: url
            };
        } else {
            if (route.methods[method]) {
                return {
                    method: method,
                    url: url,
                    route: route.route,
                    params: route.params,
                    handler: route.methods[method]
                };
            } else {
                return {
                    error: {
                        code: 405,
                        message: 'Method Not Allowed'
                    },
                    method: method,
                    url: url,
                    route: route.route,
                    params: route.params,
                    allowed: getMethods(route)
                };
            }
        }
    };

    Router.prototype.getRoutes = function () {
        return this.routes;
    };

    Router.prototype.setRoutes = function (routes) {
        this.routes = routes;
    };

    methods.forEach(function (method) {
        Router.prototype[method] = createMethodHandler(method);
    });

    module.exports = Router;
}());
