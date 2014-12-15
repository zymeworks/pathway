[![Build Status](https://drone.io/github.com/zymeworks/pathway/status.png)](https://drone.io/github.com/zymeworks/pathway/latest)

##Pathway

####JavaScript library package system inspired by Go modules

* A module is defined using one or more initialization functions
* Functions within the same package share a private '$package' object
* Your code can import a sub module in a separate Pathway library
* The import statement works with conventional JS libraries
* __Not__ a script loader, a file is not a module.

Pathway is designed for creating source libraries. This comes into play for shared libraries and larger projects where *dependency inversion* is necessary.

The purpose of this tool is to make high-level modules easier to implement in JavaScript.

### API

Define a pathway library

	makePathway('myLib', window);
	window['@myLib'];
	// => function pathway() {...}

Add a package closure:

	window['@myLib']('some/pkg', function ($import, $package) {
		var p = $import('some/other/pkg'); // import within library
		var p2 = $import('@libTwo/external/pkg'); // import from another pathway lib
		var underscoreLib = $import('@_'); // global reference fall back

		$package.ourSecret = 'shared package private variable';

		return {
			exportedField: 'exported public variable'
		};
	});

The module ‘some/pkg’ can have as many of these closures as needed. The exported fields are merged into a flat public object. Key conflicts will throw an error.

Import from outside:

	window['@myLib'].import('some/pkg');
	// => { exportedField: 'exported public variable' }

Nothing more to it.

---

__Notes:__

* Any JavaScript object can be used in place of the ‘window’ object, so long as inter library dependencies are reachable through that object
* Like Go, circular dependencies between modules are not supported
* Load order only matters within modules that use own package references during initialization.

__Links:__

* [Pathway Build Files](https://drone.io/github.com/zymeworks/pathway/files)
* Go naming conventions, [Effective Go](https://golang.org/doc/effective_go.html#names)
* Dependency Inversion, [Wikipedia](http://en.wikipedia.org/wiki/Dependency_inversion_principle)