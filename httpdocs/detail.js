$.urlParam = function(name){
	var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
	return results[1] || 0;
}

var app = angular.module("app", []);

app.controller("DetailCtrl", function($scope, $http) {

	$scope.error = '';

	angular.element(document).ready(function() {

		var g_onDocumentReady = coroutine(function*(g) {

			var params = {
            	method: 	'GET',
            	url: 		'/api/getTransaction.json?tx=' + $.urlParam('tx'),
			};

			var response = yield $httpCallback($http, params, g.resume);

			if (response.status == 'error') {
				$scope.error = response.error;
				console.log(response.error);
				return;
				throw response.error;
			}

			var tx = response.tx;
			$scope.from = "From: " + tx.from;
			$scope.to = "To: " + tx.to;
			$scope.value = "Value: " + tx.value;
			$scope.input = "Input: " + tx.input;
			$scope.gas = "Gas: " + tx.gas;
			$scope.gasprice = "GasPrice: " + tx.gasPrice;

		})

		g_onDocumentReady(function(err, result) {

			if (err) {
				console.log(err);
				return;
			}

		})

	});


})
