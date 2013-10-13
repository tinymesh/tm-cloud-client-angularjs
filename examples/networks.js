angular.module('NetworkExample', ['tmCloudClient'], function($provide) {
		$provide.value('endpoint', 'http://31.169.50.34:8080')
	})
	.controller('AuthController', function($rootScope, $scope, $sessionStorage, tmAuth, tmUser) {
		$scope.user = tmUser;
		$scope.$session = $sessionStorage;

		$scope.context = tmAuth.context;
		$scope.token = tmAuth.token;

		$scope.setContext = function(ctx) {
			tmAuth.$getToken()
				.then(function(res) {
					$scope.context = tmAuth.setContext(ctx);
					$scope.token = tmAuth.token;
					$rootScope.$broadcast("session:switch", res);
				});
		};

		// Wait until session is created before populating user object
		$rootScope.$on('session:new', function(ev) {
			$scope.user.$get();
			$scope.flash = "";
		});

		$rootScope.$on('session:destroy', function(ev) {
			$scope.user.$get();
			$scope.flash = "You have been logged out of your session.";
			$scope.flashClass = "info";
		});
	})
	.controller('LoginController', function($rootScope, $scope, tmUser, tmAuth) {
		$scope.login = function(auth) {
			tmAuth.login(auth)
				.catch(function() {
					$scope.$parent.flashClass = "danger";
					$scope.$parent.flash = "Invalid username or password.";
				});
		};
	})
	.controller('NetworkController', function($scope, tmAuth, tmNet) {
		$scope.networks = [];

		tmNet.list(function(networks) {
			$scope.networks = networks;
		});

		$scope.$on('session:switch', function(ev, auth) {
			tmNet.list(function(networks) {
				$scope.networks = networks;
			}, function(networks) {
				$scope.$parent.flashClass = "danger";
				$scope.$parent.flash = "Failed to fetch network list.";
				$scope.networks = []
			});
		});

		$scope.expandNet = function(net) {
			$scope.net = net;
			$scope.netJson = angular.toJson(net, true);
		};

		$scope.create = function(name) {
			var net = new tmNet({name: name});
			net.$create()
				.then(function(net) {
					$scope.$parent.flash = "Create new net " + net.name + " with key " + net.key;
					$scope.$parent.flashClass = "success";
					$scope.networks.push(net);
				}, function() {
					$scope.$parent.flash = "Failed to create network";
					$scope.$parent.flashClass = "danger";
				});
		};

		$scope.update = function(net) {
			net = _.extend(net, JSON.parse($scope.netJson));
			net.$update()
				.then(function() {
					$scope.$parent.flash = "Network " + (net.name || net.key) + " updated.";
					$scope.$parent.flashClass = "success";
				}, function() {
					$scope.$parent.flash = "Failed to update network '" + net.key + "'";
					$scope.$parent.flashClass = "danger";
				});
		};
	});
