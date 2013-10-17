"use strict";

angular.module('tmCloudClient', [
		  'ngStorage'
		, 'tmCloudClientUser'
		, 'tmCloudClientNetwork'
		, 'tmCloudClientDevice'
		, 'tmCloudClientMessage'
		, 'tmCloudClientStream'
	])
	.value('endpoint', 'http://31.169.50.34:8080')
	.service('tmCloud', function() {
		return new function() {
			var secret, obj;
			obj = {
				setSecret: function(newSecret) {
					secret = newSecret;
					return true;
				},
				sign: function(method, url, payload) {
					var buf;

					buf += secret + "\n";
					buf += method + "\n";
					buf += url + "\n";
					buf += payload + "\n";

					return CryptoJS.SHA256(buf).toString(CryptoJS.enc.Base64)
				}
			};

			return obj;
		};
	});

angular.module('tmCloudClientUser', ['ngResource'])
	.factory('tmAuth', function($resource, $rootScope, tmCloud, endpoint, $sessionStorage) {
		var impl, res, onAuth, onAuthDestroy;

		$sessionStorage.$default({
			authenticated: false,
			authResource: null,
			resource: null
		});

		onAuth = function(auth) {
			$sessionStorage.authResource = auth;
			$sessionStorage.authenticated = true;
			auth.setResource($sessionStorage.resource || "tmc");
			$rootScope.$broadcast('session:new', auth)
		};

		onAuthDestroy = function() {
			$sessionStorage.$reset();
			$rootScope.$broadcast('session:destroy');
		};

		impl = $resource(endpoint + '/auth', {}, {
			_login:   {method: 'POST'}, // credentials are the signature here
			_logout:  {method: 'DELETE', transformRequest: function(data, headers) {
				return res.signReq('DELETE', '/auth', data, headers);
			}},
			getToken: {method: 'GET',
				transformRequest: function(data, headers) {
					return res.signReq('GET', '/auth', data, headers);
				}
			}
		});

		// Authenticate local $sessionStorage against remote API
		impl.__proto__.getResource = function(remote) {
			var auth;

			auth = new impl($sessionStorage.authResource);
			auth.resource = $sessionStorage.resource || "tmc";
			auth.token = ("tmc" === auth.resource) ? auth.user_token : auth.resources[auth.resource].token;

			if ($sessionStorage.authResource && remote) {
				// if servers says unauthorized, equivalent to logout
				auth.$getToken(onAuth, onAuthDestroy);
			}

			return auth;
		};

		res = impl.getResource(true);

		res.__proto__.login = function(body) {
			var hash;

			hash = this.hashPassword(body.password, body.email)
			this.email = body.email;
			this.password = hash;

			return this.$_login(onAuth);
		};

		res.__proto__.hashPassword = function(password, email) {
			var hash;

			hash = CryptoJS.SHA256((email || this.email) + "_" + password);

			return hash.toString(CryptoJS.enc.Base64);
		};

		res.__proto__.logout = function() {
			return this.$_logout(onAuthDestroy);
		};

		res.__proto__.setResource = function(ctx) {
			if (!this.resources || undefined === this.resources[ctx] && ctx !== 'tmc') {
				return false;
			} else if (ctx === 'tmc') {
				this.token = this.user_token;
			} else {
				this.token = this.resources[ctx].token;
			}

			// @todo olav; 2013-10-01 fix proper a secret
			tmCloud.setSecret(this.token);

			return this.resource = $sessionStorage.resource = ctx;
		};

		// Adds authorization header and signs requests
		res.__proto__.signReq = function(method, url, data, headers) {
			var info = this.getAuthInfo(method, url, data);

			headers()['Authorization'] = info.resource + " " + info.token + ":" + info.signatur;
			return data;
		};

		res.__proto__.getAuthInfo = function(method, url, data) {
			var token;

			if (this.resource === 'tmc') {
				token = this.user_token;
			} else {
				token = this.resources[this.resource].token;
			}

			return {
				resource: this.resource,
				token:    token,
				signatur: tmCloud.sign(method, endpoint + url, data)
			};
		};


		return res;
	})
	.factory('tmUser', function($resource, endpoint, tmAuth, tmCloud) {
		var impl, res;
		impl = $resource(endpoint + '/user', {}, {
			get: {method: 'GET', transformRequest: function(data, headers) {
				return tmAuth.signReq('GET', '/user', "", headers);
			}},
			update: {method: 'PUT', transformRequest: function(data, headers) {
				data = angular.toJson(_.omit(data, '$promise', '$resolved', 'resource', 'resources', 'user_token'));
				return tmAuth.signReq('GET', '/user', data, headers);
			}}
		});

		res = new impl();

		res.__proto__.setPassword = function(password) {
			this.password = tmAuth.hashPassword(password, this.email);
		};


		return res;
	});

angular.module('tmCloudClientNetwork', ['ngResource'])
	.factory('tmNet', function($resource, endpoint, tmAuth) {
		return $resource(endpoint + '/network/:id', {id: '@key'}, {
			list: {method: 'GET', isArray: true, transformRequest: function(data, headers) {
				return tmAuth.signReq('GET', '/network', "", headers);
			}},
			create: {method: 'POST', transformRequest: function(data, headers) {
				data = angular.toJson(data);
				return tmAuth.signReq('POST', '/network', data, headers);
			}},
			update: {method: 'PUT', transformRequest: function(data, headers) {
				var omit = ['addr', 'counters', 'devices', 'key'];
				data = angular.toJson(_.omit(data, omit));
				return tmAuth.signReq('PUT', '/network/'  + data.network, data, headers);
			}},
			get: {method: 'get', transformRequest: function(data, headers) {
				var omit = ['addr', 'counters', 'devices', 'key'];
				data = angular.toJson(_.omit(data, omit));
				return tmAuth.signReq('PUT', '/network/'  + data.network, data, headers);
			}},
		});
	});

angular.module('tmCloudClientMessage', ['ngResource'])
	.factory('tmMsgList', function($resource, endpoint, tmAuth) {
		var res = $resource(endpoint + '/message/:net/:device', {}, {
			list: {method: "GET", isArray: true, transformRequest: function(data, headers) {
				var uri = '/message/';
				return tmAuth.signReq('GET', uri, "", headers);
			}},

		});

		return res;
	})
	.factory('tmMsg', function($resource, endpoint, tmAuth) {
		var res = $resource(endpoint + '/message/:network/:device/:message', {}, {
			get: {method: "GET"},
			create: {method: 'POST', transformRequest: function(data, headers) {
				data = angular.toJson(data);
				return tmAuth.signReq('POST', '/message/', data, headers);
			}}
		});

		return res;
	})

angular.module('tmCloudClientStream', ['ngResource'])
	.factory('tmStream', function($resource, endpoint, tmAuth) {
		// support for filters are limited, only by network,device and
		// class. Class expands to any combination of `network`,
		// `device`, `message`, `channel`. 
		return function(filter) {
			var info, url = endpoint + '/stream';
			filter = filter || {};
			info = tmAuth.getAuthInfo("GET", url, "");

			url += filter.network ? '/' + filter.network : '';
			url += filter.device ? '/' + filter.device : '';

			// ATM we don't sign these requests, since we need to
			// include the signature in the url itself
			// Note: token is not escaped for url, this is intentional
			if (filter.class) {
				url += '?class=' + filter.class + '&auth=' + info.resource + ':' + info.token;
			} else {
				url += '?auth=' + info.resource + ':' + info.token;
			}

			return new EventSource(url, {withCredentials: false});
		};

	});
