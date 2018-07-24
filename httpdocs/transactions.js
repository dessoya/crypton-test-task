
var app = angular.module("app", []);

app.controller("TransactionsCtrl", function($scope, $http) {

	$scope.transactions = [	];

	$scope.addRow = function() {

		var g_addRow = coroutine(function*(g) {

			var fileToLoad = $scope.file;
			var fileLoadedEvent = yield readLocalFile(fileToLoad, g.resume);

			var params = {
            	method: 	'POST',
            	url: 		'/api/sendTransaction.json',
	            
	            data: {
					"keystore": fileLoadedEvent.target.result,
					"password": $scope.key_store_password,
					"amount": $scope.amount
	            },
	            
	            transformRequest: function (data, headersGetter) {

					var formData = new FormData();
	                angular.forEach(data, function (value, key) {
	                    formData.append(key, value);
	                });

	                var headers = headersGetter();
	                delete headers['Content-Type'];                
	                return formData;

	            }
	        };

			var response = yield $httpCallback($http, params, g.resume);
			$scope.transactions.push({ createdAt: response.createdAt, tx: response.tx });
			console.log(response);

		});

		g_addRow(function(err, result) {

			if (err) {
				console.log(err);
				return;
			}

		})
        
        return;
	};

	angular.element(document).ready(function() {

		var g_onDocumentReady = coroutine(function*(g) {

			var params = {
            	method: 	'GET',
            	url: 		'/api/list.json',
			};

			var response = yield $httpCallback($http, params, g.resume);

			if (response.status == 'error') {
				throw response.error;
			}

			var txs = response.txs;
			$scope.transactions = txs;

		})

		g_onDocumentReady(function(err, result) {

			if (err) {
				console.log(err);
				return;
			}

		})

	});

})
.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}])
;
