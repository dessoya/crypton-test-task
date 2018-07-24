function readLocalFile(fileToLoad, callback) {
	var fileReader = new FileReader();

    fileReader.onload = function (fileLoadedEvent) {
    	callback(null, fileLoadedEvent);
    }

    fileReader.readAsDataURL(fileToLoad);
}

function $httpCallback($http, params, callback) {
	$http(params)
		.success(function (data, status, headers, config) {
			callback(null, data);
		})
		.error(function (data, status, header, config) {
			callback(data);
		})
}
