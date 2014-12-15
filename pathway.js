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
  var library = global['@' + libName] = function pathway(a, b, c) {
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
    var pkg = packages.$$(pkgN);
    if (typeof init === 'function') {
      if (pkg === undefined) {
        pkg = packages.$$(pkgN, []);
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

    if ((pkg = packages.$$(pkgN)) === 'In Progress') {
      return 'In Progress';
    } else {
      return pkg;
    }
  };
  library['import'] = library;

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
        if (typeof global[toLib] === 'function') {
          pkg = global[toLib](toPkg, cxt);
        } else if (toLib.substr(1) in global) {
          return global[toLib.substr(1)];
        } else {
          throw new Error("Pathway: Failed to import library: " + to + " from " + cxt);
        }
      } else {
        pkg = library(toPkg, cxt);
      }
      if (pkg === 'In Progress') {
        throw new Error("Pathway: Circular import between: " + cxt + " and " + (to || '/'));
      }
      return pkg;
    };
  }

  /**
   * execute init functions and obtain exports
   *
   * @param  {String} pkName  Identifier string of the package to initialize
   * @param  {String} cxt     A string which identifies the caller, useful for error messages
   * @return {Object}         A map of the exported fields from the package
   */
  function _initPackage(pkName, cxt) {
    var pkg = packages.$$(pkName),
        inits, self, exp;
    if (pkg === void 0) {
      throw new Error("Pathway: Failed to import package: '" + _fmtAddr(pkName) + "'" + (cxt ? " from: " + cxt : ""));
    } else if (pkg instanceof Array) {
      inits = pkg;
      pkg = {};
      packages.$$(pkName, 'In Progress');
      self = _createSelf(pkg);
      for (var i = 0, len = inits.length; i < len; i++) {
        exp = inits[i](_importer(self, pkName), self);
        switch (typeof exp) {
          case 'object':
            _merge(pkg, exp, _fmtAddr(pkName));
            break;
          case 'undefined':
            break;
          default:
            throw new Error('Pathway: Invalid export: \'' + exp + '\' from ' + _fmtAddr(pkName));
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
        er = new Error("Pathway: Key conflict: '" + key + "'");
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

  function _fmtAddr(pkg) {
    return "@" + libName + '/' + pkg.replace(/^\//, '');
  }

  return library;
}