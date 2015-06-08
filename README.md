[![Build Status](https://drone.io/github.com/zymeworks/pathway/status.png)](https://drone.io/github.com/zymeworks/pathway/latest)

##Pathway

####JavaScript library package system inspired by Go modules

This is a bare bones tool to achieve high-level modules in JavaScript. The aim is to define a convention for wiring up modular code in a way that is flexible and as uncomplicated as possible.

The approach is to separate modules from script loading and make the bootstrap process up-front and synchronous.

Pathway is intended for use in projects with a build system. Pathway itself has minimal code to facilitate being inlined for deployment.

### API

Define a pathway library

	var root = {};
	makePathway('myLib', root);
	root['@myLib'];
	// => function pathway() {...}

<code>root</code> here is your designated global object. It could be <code>window</code>, or some sort of sandbox.

Add a package closure:

	root['@myLib']('some/pkg', function ($import, $package) {
		var p = $import('some/other/pkg'); // import within library
		var p2 = $import('@libTwo/external/pkg'); // import from another pathway lib
		var underscoreLib = $import('@_'); // global reference fall back

		$package.ourSecret = 'shared package private value';

		return {
			exportedField: 'exported public value'
		};
	});

The module ‘some/pkg’ can have as many of these closures as needed. The exported fields are merged into a module API object. Key conflicts will throw an error.

Import from outside:

	root['@myLib'].import('some/pkg');
	// => { exportedField: 'exported public value' }

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
* Any JavaScript object can be used as 'root' object (eg window), so long as inter library dependencies are reachable through that object
* Like Go, circular dependencies between modules are not supported (or desired)
* Initialization order only matters within modules that use own package references during init.

### Links

* [Pathway Build Files](https://drone.io/github.com/zymeworks/pathway/files)
* Gulp integration [gulp-pathway](https://github.com/zymeworks/gulp-pathway)
* Go naming conventions, [Effective Go](https://golang.org/doc/effective_go.html#names)
* Dependency Inversion, [Wikipedia](http://en.wikipedia.org/wiki/Dependency_inversion_principle)