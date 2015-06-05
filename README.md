[![Build Status](https://drone.io/github.com/zymeworks/pathway/status.png)](https://drone.io/github.com/zymeworks/pathway/latest)

##Pathway

####JavaScript library package system inspired by Go modules

The purpose of this tool is to make high-level modules simpler to implement in JavaScript by separating the process from script loading and making it synchronous.

Pathway is designed for creating source libraries. This comes into play for shared libraries and larger projects where dependency inversion is useful.

### API

Define a pathway library

	var root = {};
	makePathway('myLib', root);
	root['@myLib'];
	// => function pathway() {...}

Add a package closure:

	root['@myLib']('some/pkg', function ($import, $package) {
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

	root['@myLib'].import('some/pkg');
	// => { exportedField: 'exported public variable' }

Nothing more to it.


### Import between libraries & global dependencies

Simple-as-possible mechanism for combining separate libraries. It is synchronous and does not support circular imports.

Method 1. __Providers__

* Function defined on the root object using '@' prefix
* It is invoked with a path

		$import('@myLib/utils') => root['@myLib']('/utils')


Method 2. __Global libs__

* Named property on the root object
* Fall-back if a provider function was not found

		$import('@jQuery') => root.jQuery


$import therefore, removes any practical need for direct global references in your library.

### Notes

* A module is defined using one or more initialization functions
* '$package' is an object shared by closures within the same package
* This is __not__ related to script loading, a file is not a module.
* Any JavaScript object can be used as 'root' object (eg window), so long as inter library dependencies are reachable through that object
* Like Go, circular dependencies between modules are not supported (or desired)
* Initialization order only matters within modules that use own package references during init.

### Links

* [Pathway Build Files](https://drone.io/github.com/zymeworks/pathway/files)
* Gulp integration [gulp-pathway](https://github.com/zymeworks/gulp-pathway)
* Go naming conventions, [Effective Go](https://golang.org/doc/effective_go.html#names)
* Dependency Inversion, [Wikipedia](http://en.wikipedia.org/wiki/Dependency_inversion_principle)