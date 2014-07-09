app = {};
app.init = function(socketio){
	var ngAppName = 'appTau';
	$('html').attr('ng-app', ngAppName);
	var ngApp = angular.module(ngAppName, ['ngAnimate', 'mgcrea.ngStrap', 'picardy.fontawesome']);
	ngApp.factory('socket', function($rootScope){
		return {
			on   : function(eventName, callback){
				socketio.on(eventName, function(){
					var args = arguments;
					$rootScope.$apply(function(){
						callback.apply(socketio, args);
					});
				});
			},
			emit : function(eventName, data, callback){
				socketio.emit(eventName, data, function(){
					var args = arguments;
					$rootScope.$apply(function(){
						if (callback){
							callback.apply(socketio, args);
						}
					});
				})
			}
		};
	});
	ngApp.directive('ngEnter', function(){
		return function(scope, element, attrs){
			element.bind("keydown keypress", function(event){
				if (event.which === 13){
					scope.$apply(function(){
						scope.$eval(attrs.ngEnter);
					});

					event.preventDefault();
				}
			});
		};
	});
	ngApp.controller('mainCtl', function($scope, $http, socket){
		$scope.request = '';
		$scope.onRatingRequest = function(id){
			$scope.validate_error = false;
			$scope.inProgress = true;
			$scope.error = false;
			$scope.filmname = false;
			$scope.kp_vote = false;
			socket.emit('rating.request', {id : $scope.request});
		};

		socket.on('film.name.response', function(data){
			$scope.filmname = data;
		});
		socket.on('rating.response', function(data){
			$scope.inProgress = false;
			$scope.resp = data;
			if (data.status === 'ok'){
				$scope.imdb_vote = data.rating.imdb_rating.num_vote;
				$scope.kp_vote = data.rating.kp_rating.num_vote;
				$scope.imdb_rate = data.rating.imdb_rating.$t;
				$scope.kp_rate = data.rating.kp_rating.$t;
			} else if (data.status === 'not_found'){
				$scope.error = 'Фильм мне найден по указанному ID';
			} else if (data.status === 'kp_error'){
				$scope.error = 'Служба рейтингов кинопоиска временно недоступна';
			} else if (data.status === 'validate_error'){
				$scope.validate_error = true;
				$scope.error = 'Неверный формат ID';
			} else {
				$scope.error = 'Произошла неизвестная ошибка';
			}
		});
	});

	angular.bootstrap(document, [ngAppName]);
};

app.run = function(socketio){

};

