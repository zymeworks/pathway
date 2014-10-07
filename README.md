Pathway
=======

###JavaScript library package framework.

The objective of Pathway is to enable high-level modules within JavaScript code libraries. Primarily this involves breaking the direct link between files and modules.

Create a library manifest:

	makePathway('myLib', globalObj);
	globalObj['@myLib'];
	=> function pathway() {...}

Package closure:

	globalObj['@myLib']('some/pkg', function ($import, $package) {
		var p = $import('some/other/pkg'); // imports from myLib
		var p2 = $import('@libTwo/external/pkg'); // imports from another pathway lib
		var underscore = $import('@_'); // imports non pathway api

		$package.ourSecret = 'shared package private variable';

		return {
			exportedField: 'exported public variable'
		};
	});

The module 'some/pkg' can have as many of these closures as needed. The exported fields are merged into a flat api object.

Import from outside:

	globalObj['@myLib'].import('some/pkg');
	=> { exportedField: 'exported public variable' }

