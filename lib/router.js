(function () {
    'use strict';
    var separatorRegExp = /^[\s\/]+|[\s\/]+$/g;
    var paramsRegExp = /^{((([^:]+):(.+))|(.+))}$/;

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
                    if (!current.others) {
                        return null;
                    }
                    current = current.others;
                    params[current.name] = parts[i];
                }
            }

        if (!current.methods) {
            return null;
        }
        return {
            methods: current.methods,
            route: current.route,
            params: params
        };
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

        var parts = route.replace(separatorRegExp, '').split('/');
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
                            regexp: new RegExp('^' + paramsMatch[4] + '$')
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

    Router.prototype.getOptions = function (url) {
        var route = match(url, this.routes);
        if (!route) {
            return null;
        }
        return getMethods(route);
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
        }

        if (route.methods[method]) {
            return {
                method: method,
                url: url,
                route: route.route,
                params: route.params,
                handler: route.methods[method]
            };
        }

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
    };

    Router.prototype.getRoutes = function () {
        return this.routes;
    };

    Router.prototype.setRoutes = function (routes) {
        this.routes = routes;
    };

    Router.prototype.options = function (route, handler) {
        this.addRoute('OPTIONS', route, handler);
    };

    Router.prototype.get = function (route, handler) {
        this.addRoute('GET', route, handler);
    };

    Router.prototype.head = function (route, handler) {
        this.addRoute('HEAD', route, handler);
    };

    Router.prototype.post = function (route, handler) {
        this.addRoute('POST', route, handler);
    };

    Router.prototype.put = function (route, handler) {
        this.addRoute('PUT', route, handler);
    };

    Router.prototype.delete = function (route, handler) {
        this.addRoute('DELETE', route, handler);
    };

    Router.prototype.trace = function (route, handler) {
        this.addRoute('TRACE', route, handler);
    };

    Router.prototype.connect = function (route, handler) {
        this.addRoute('CONNECT', route, handler);
    };

    module.exports = Router;
}());
