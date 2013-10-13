angular.module('IOExample', ['tmCloudClient'], function($provide) {
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
	.controller('IOController', function($scope, $location, $q, tmNet, tmMsg, tmStream) {
		$scope.networks = [];
		$scope.net = undefined;
		$scope.devices = [];
		$scope.num = 0;

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

		$scope.$on('session:switch', function(ev, auth) {
			if ($scope.esource)
				$scope.esource.close();

			tmNet.list({device: "expand"}).$promise
				.then(function(networks) {
					$scope.networks = networks;

					if ($location.$$search.network) {
						$scope.setNet(
							_.findWhere($scope.networks,
								{key: $location.$$search.network}));
					}
				}, function(networks) {
					$scope.$parent.flashClass = "danger";
					$scope.$parent.flash = "Failed to fetch network list.";
					$scope.networks = []
					$scope.net = {name: "None Selected"};
				});
		});

		var evCallback, promises = {};
		evCallback = function(resp) {
            $scope.$apply(function () {
				var i, p, msg = JSON.parse(resp.data).message;

				if ('event/ack' === msg.type) {
					if (promises[msg.device + '_' + msg['proto/tm'].msg_data]) {
						p = promises[msg.device + '_' + msg['proto/tm'].msg_data];
						p.resolve(msg);
						i = _.indexOf($scope.net.devices, _.findWhere($scope.net.devices, {key: msg.device}));
						$scope.net.devices[i]['tm/state']['proto/tm'] = angular.extend(
							$scope.net.devices[i]['tm/state']['proto/tm'],
							msg['proto/tm']);
					}
				}
			});
		};

		$scope.setNet = function(net) {
			if ($scope.esource)
				$scope.esource.close();

			if (net) {
				$scope.net = net;
				$scope.devices = _.groupBy(net.devices, 'type');

				$location.search('network', net.key);

				$scope.esource = new tmStream({network: net.key});
				$scope.esource.addEventListener('message', evCallback, false);
			} else {
				$scope.net = undefined;
			}
		};


		$scope.on = function(dev) {
			var msg = new tmMsg({
				type: "command",
				command: "set_output",
				"output" : {0: 1},
				cmd_number: ++$scope.num % 255
			});

			$scope.sendMsg(dev, msg, 'Lights where switched on');
		};

		$scope.off = function(dev) {
			var msg = new tmMsg({
				type: "command",
				command: "set_output",
				"output" : {0: 0},
				cmd_number: ++$scope.num % 255
			});

			$scope.sendMsg(dev, msg, 'Lights are now off!');
		};

		$scope._pwm = {};
		$scope.pwm = function(dev) {
			var msg = new tmMsg({
				type: "command",
				command: "set_pwm",
				pwm : Math.abs(100 - parseInt($scope._pwm[dev.key])),
				cmd_number: ++$scope.num % 255
			});

			$scope.sendMsg(dev, msg, 'Lights dimmed successfully!');
		};

		$scope.configure = function(dev) {
			var msg = new tmMsg({
				type: "command",
				command: "set_config",
				cmd_number: ++$scope.num % 255,
				config: {
					gpio_0_config: 0,
					gpio_4_config: 1,
					gpio_4_trigger: 3,
					gpio_7_config: 3,

				}
			});

			$scope.sendMsg(dev, msg, 'Device configuration updated!');
		};

		$scope.sendMsg = function(dev, msg, text) {
			promises[dev.key + '_' + msg.cmd_number] = $q.defer();
			promises[dev.key + '_' + msg.cmd_number].promise.then(
				function() {
					$scope.setDevText(dev, 'success', text);
				}, function() {
					$scope.setDevText(dev, 'warning', 'RF-Module did not respond');
				});

			msg.$create({network: $scope.net.key, device: dev.key})
				.then(function(res) {
					$scope.setDevText(dev, 'info', 'Waiting for acknowledgement');
				}, function() {
					$scope.setDevText(dev, 'danger', 'Error trying to reach server');
				});

			return promises[dev.key + '_' + msg.cmd_number].promise;
		};

		$scope.setDevText = function(dev, cssclass, text) {
			dev.textClass = cssclass;
			dev.text = text;
		};
	});
