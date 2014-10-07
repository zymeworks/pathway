function makePathway(libName, global) {
  'use strict';
  var packages = {
    $$: function (name, newval) {
      if (name === '/') name = '';
      if (newval === void 0) {
        return this['~' + name];
      } else {
        return (this['~' + name] = newval);
      }
    }
  };
  /**
   * create the library manifest and assign to
   * the global object with the prefix '@'
   */
  var library = global['@' + libName] = function pathway(a, b) {
    var pkgN = '/', init;
    switch (typeof a) {
      case 'string':
        pkgN = a;
        init = b;
        break;
      case 'function':
        init = a;
        break;
    }
    var pkg = packages.$$(pkgN);
    if (typeof init === 'function') {
      if (pkg === undefined) {
        pkg = packages.$$(pkgN, []);
      }
      if (pkg instanceof Array) {
        pkg.push(init);
      } else {
        throw new Error("Package " + _fmtAddr(libName, pkgN) + " has already been initialized");
      }
    } else {
      _initPackage(pkgN);
    }

    if ((pkg = packages.$$(pkgN)) === 'In Progress') {
      return 'In Progress';
    } else {
      return _copy(pkg);
    }
  };
  library['import'] = library;

  /**
   * in-script import function
   */
  function _importer(self, from) {
    return function (to) {
      if (to === '.') return self;
      //
      var pkg,
          ref = to.match(/^((@[^\/]*)?\/?)(.*)$/) || [],
          toLib = ref[2],
          toPkg = ref[3];
      if (toLib) {
        if (typeof global[toLib] === 'function') {
          pkg = global[toLib](toPkg);
        } else if (toLib.substr(1) in global) {
          return global[toLib.substr(1)];
        } else {
          throw new Error("Unable to find library: " + to);
        }
      } else {
        pkg = library(toPkg);
      }
      if (pkg === 'In Progress') {
        throw new Error("Circular import between: " + _fmtAddr(libName, from) + " and " + (to || '/'));
      }
      return pkg;
    };
  }

  /**
   * execute init functions and obtain exports
   */
  function _initPackage(pkName) {
    var pkg = packages.$$(pkName),
        inits, self, exp;
    if (pkg === void 0) {
      throw new Error("This package is fiction: '" + _fmtAddr(libName, pkName) + "'");
    } else if (pkg instanceof Array) {
      inits = pkg;
      pkg = {};
      packages.$$(pkName, 'In Progress');
      self = _createSelf(pkg);
      for (var i = 0, len = inits.length; i < len; i++) {
        exp = inits[i](_importer(self, pkName), self);
        switch (typeof exp) {
          case 'object':
            _merge(pkg, exp, _fmtAddr(libName, pkName));
            break;
          case 'undefined':
            break;
          default:
            throw new Error('Invalid export: \'' + exp + '\' from ' + _fmtAddr(libName, pkName));
        }
      }
      packages.$$(pkName, pkg);
    }
    return pkg;
  }

  // ------
  // Helper
  // ------

  function _createSelf(mod) {
    function Self() {}
    Self.prototype = mod;
    return new Self();
  }

  function _merge(to, from, cxt) {
    if (!to || !from) return;
    var key, er;
    for (key in from) {
      if (to.hasOwnProperty(key)) {
        er = new Error("Key conflict: '" + key + "'");
        if (cxt) er.message += ' at ' + cxt;
        throw er;
      }
      to[key] = from[key];
    }
    return to;
  }

  function _copy(obj) {
    return _merge({}, obj);
  }

  function _fmtAddr(lib, pkg) {
    return "@" + lib + '/' + pkg.replace(/^\//, '');
  }

  return library;
}