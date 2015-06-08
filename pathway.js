function makePathway(libName, root) {
  'use strict';
  var packages = {
    set: function (name, value) {
      // '~' is used to avoid strange behavior if
      // a pkg is named 'hasOwnProperty' for example
      return (this['~' + (name || '/')] = value);
    },
    get: function (name) {
      return this['~' + (name || '/')];
    }
  };
  /**
   * create the library manifest and assign to
   * the root object with the prefix '@'
   */
  var library = root['@' + libName] = function pathway(a, b, c) {
    var pkgN = '/', init, cxt;
    switch (typeof a) {
      case 'string':
        pkgN = a;
        init = b;
        cxt = c;
        break;
      case 'function':
        init = a;
        cxt = b;
        break;
    }
    var pkg = packages.get(pkgN);
    if (typeof init === 'function') {
      if (pkg === undefined) {
        pkg = packages.set(pkgN, []);
      }
      if (pkg instanceof Array) {
        pkg.push(init);
      } else {
        throw new Error("Pathway: Package " + _fmtAddr(pkgN) + " has already been initialized." + (cxt ? " (from " + cxt + ")" : ""));
      }
    } else {
      cxt = b;
      _initPackage(pkgN, cxt);
    }
    return packages.get(pkgN);
  };
  library['import'] = library;

  /**
   * execute init functions and obtain exports
   *
   * @param  {String} pkName  Identifier string of the package to initialize
   * @param  {String} cxt     A string which identifies the caller, useful for error messages
   * @return {Object}         A map of the exported fields from the package
   */
  function _initPackage(pkName, cxt) {
    var publ = packages.get(pkName),
        inits, self, returned, key, er, i, len;
    if (publ === void 0) {
      throw new Error("Pathway: Failed to import package: '" + _fmtAddr(pkName) + "'" + (cxt ? " from: " + cxt : ""));
    } else if (publ instanceof Array) {
      inits = publ;
      publ = {};
      packages.set(pkName, 'In Progress!');

      // Create internal package instance with the
      // public api object as its prototype
      var Internal = function () {}
      Internal.prototype = publ;
      self = new Internal();

      // execute package functions in the order they were registered
      len = inits.length;
      for (i = 0; i < len; i++) {
        returned = inits[i](_importer(self, pkName), self);
        if (returned && typeof returned === 'object') {
          for (key in returned) {
            if (publ.hasOwnProperty(key)) {
              throw new Error("Pathway: Key conflict: '" + key + "'" + (pkName ? ' at ' + _fmtAddr(pkName) : ''));
            }
            publ[key] = returned[key];
          }

        } else if (returned !== void 0) {
          throw new Error('Pathway: Invalid export: \'' + returned + '\' from ' + _fmtAddr(pkName));
        }
      }
      packages.set(pkName, publ);
    }
    return publ;
  }

  /**
   * in-script import function
   */
  function _importer(self, from) {
    var cxt = _fmtAddr(from);
    return function (to) {
      if (to === '.') return self;
      //
      var pkg,
          ref = to.match(/^((@[^\/]*)?\/?)(.*)$/) || [],
          toLib = ref[2],
          toPkg = ref[3];
      if (toLib) {
        if (typeof root[toLib] === 'function') {
          pkg = root[toLib](toPkg, cxt);
        } else if (toLib.substr(1) in root) {
          return root[toLib.substr(1)];
        } else {
          throw new Error("Pathway: Failed to import library: " + to + " from " + cxt);
        }
      } else {
        pkg = library(toPkg, cxt);
      }
      if (pkg === 'In Progress!') {
        throw new Error("Pathway: Circular import between: " + cxt + " and " + (to || '/'));
      }
      return pkg;
    };
  }

  function _fmtAddr(pkg) {
    return "@" + libName + '/' + pkg.replace(/^\//, '');
  }

  return library;
}