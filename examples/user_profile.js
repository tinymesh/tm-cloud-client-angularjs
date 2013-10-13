angular.module('AuthExample', ['tmCloudClient'], function($provide) {
		$provide.value('endpoint', 'http://31.169.50.34:8080')
	})
	.controller('AuthController', function($rootScope, $scope, $sessionStorage, tmUser) {
		$scope.user = tmUser;
		$scope.$session = $sessionStorage;

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
	.controller('UserController', function($scope, tmUser, tmAuth) {
		var onUpdate, flash;
		flash = function() {
			$scope.$parent.flashClass = "success";
			$scope.$parent.flash = "User updated succesfully";
		};

		$scope.password = {a: "", b: ""};
		$scope.update = function() {
			if ($scope.password.a && $scope.password.a === $scope.password.b) {
				$scope.user.setPassword($scope.password.a);

				onUpdate = function() {
					tmAuth.login({
						email: $scope.user.email,
						password: $scope.password.a
					}).then(function() {
						flash();
					});
				};
			}

			return tmUser.$update(onUpdate || flash, function() {
					$scope.$parent.flashClass = "danger";
					$scope.$parent.flash = "Error updating user";
				});
		};

		$scope.context = tmAuth.context;
		$scope.token = tmAuth.token;

		$scope.setContext = function(ctx) {
			$scope.context = tmAuth.setContext(ctx);
			$scope.token = tmAuth.token;
			tmAuth.$getToken();
		};

		$scope.logout = function() { tmAuth.logout(); };
	});
