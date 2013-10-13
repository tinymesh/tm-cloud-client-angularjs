angular.module('StreamExample', ['tmCloudClient'], function($provide) {
		$provide.value('endpoint', 'http://31.169.50.34:8080');
	})
	.controller('AuthController', function($rootScope, $scope, $sessionStorage, tmAuth, tmUser) {
		$scope.user = tmUser;
		$scope.$session = $sessionStorage;

		$scope.context = tmAuth.context;
		$scope.token = tmAuth.token;

		$scope.setContext = function(ctx) {
			tmAuth.$getToken()
				.then(function(res) {
					$scope.context = tmAuth.setResource(ctx);
					$scope.token = tmAuth.token;
					$rootScope.$broadcast("session:switch", res);
				});
		};

		// Wait until session is created before populating user object
		$rootScope.$on('session:new', function(ev, auth) {
			$scope.setContext(auth.resource);
			$scope.user.$get();
			$scope.flash = "";
		});

		$rootScope.$on('session:destroy', function(ev) {
			$scope.user.$get();
			$scope.flash = "You have been logged out of your session.";
			$scope.flashClass = "info";
		});

		$scope.logout = function() {
			tmAuth.logout();
		};
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
	.controller('StreamController', function($scope, $location, $sessionStorage, tmNet, tmStream) {
		$scope.networks = [];
		$scope.net = undefined;
		$scope.data = [];

		$scope.$on('session:switch', function(ev, auth) {
			if ($scope.esource)
				$scope.esource.close();

			tmNet.list({device: "expand"}).$promise
				.then(function(networks) {
					$scope.networks = networks;
					$scope.net = $scope.networks[0] || undefined;
				}, function(networks) {
					$scope.$parent.flashClass = "danger";
					$scope.$parent.flash = "Failed to fetch network list.";
					$scope.networks = []
					$scope.net = {name: "None Selected"};
				});
		});

		var evCallback = function (resp) {
            $scope.$apply(function () {
				var pre, msg = JSON.parse(resp.data).message;
				pre  = 'command' === msg['proto/tm'].type ? '>' : '<';
				pre += ' ' + new Date().toISOString();
                $scope.data.unshift(pre + " " + msg['proto/tm']._raw);
            });
        };

		$scope.setNet = function(net) {
			if ($scope.esource)
				$scope.esource.close();

			if (net) {
				$scope.net = net;
				$location.search('network', net.key);
				$scope.esource = new tmStream({network: net.key});
				$scope.esource.addEventListener('message', evCallback, false);
			} else {
				$scope.net = undefined;
			}
		};

		$scope.$on('session:new', function() {
			tmNet.list({device: "expand"})
				.$promise.then(function(networks) {
					$scope.networks = networks;

					if ($location.$$search.network) {
						$scope.setNet(
							_.findWhere($scope.networks,
								{key: $location.$$search.network}));
					}
				});
		});
	});
