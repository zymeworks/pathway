describe("makePathway", function () {
  var global;
  beforeEach(function () {
    global = {};
    makePathway('testLibrary', global);
  });

  it("should have created a manifest function", function() {
    expect(global['@testLibrary']).toEqual(jasmine.any(Function));
  });

  it("should register a root init", function() {
    var spy = jasmine.createSpy();
    global['@testLibrary'](spy);
    global['@testLibrary']();
    expect(spy).wasCalled();
  });

  it("should define exports", function() {
    global['@testLibrary'](function () {
      return {
        test: "value"
      };
    });
    expect(global['@testLibrary']().test).toEqual('value');
  });

  it("should throw an error if any imports don't exist", function () {
    global['@testLibrary'](function ($import) {
      $import('non/existent/package');
    });
    expect(function() {
      global['@testLibrary']();
    }).toThrow("Pathway: Failed to import package: '@testLibrary/non/existent/package' from: @testLibrary/");
  });

  it("should throw an error if its export is invalid ", function () {
    global['@testLibrary'](function () {
      return 123;
    });
    expect(function() {
      global['@testLibrary']();
    }).toThrow("Pathway: Invalid export: '123' from @testLibrary/");
  });



  it("should throw an error if an module has be init'ed already", function() {
    global['@testLibrary'](function () {});
    global['@testLibrary']();
    expect(function () {
      global['@testLibrary'](function () {}, 'test');
    }).toThrow('Pathway: Package @testLibrary/ has already been initialized. (from test)');
  });

  it("should throw if you try to init a package that doesn't exist", function() {
    expect(function () {
      global['@testLibrary']('doesnt/exist');
    }).toThrow("Pathway: Failed to import package: '@testLibrary/doesnt/exist'");
  });

  describe("between packages", function () {
    beforeEach(function () {
      global['@testLibrary']('sub', function () {
        return {
          subTest: "other value"
        };
      });
      global['@testLibrary'](function ($import) {
        return {
          test: "value",
          sub: $import('sub')
        };
      });
    });

    it("should create a sub package", function() {
      expect(global['@testLibrary']('sub').subTest).toEqual('other value');
    });

    it("should import one from another", function() {
      expect(global['@testLibrary']().sub.subTest).toEqual("other value");
    });

    it("should add another module definition", function() {
      global['@testLibrary']('sub', function ($import) {
        return {
          sub2: "yet another value"
        };
      });
      expect(global['@testLibrary']('sub').sub2).toEqual("yet another value");
    });

    it("should call the init once", function() {
      var spy = jasmine.createSpy();
      global['@testLibrary']('sub', spy);
      global['@testLibrary']('sub');
      global['@testLibrary']('sub');
      expect(spy.callCount).toEqual(1);
    });

    it("should pass a special self object between script in the same module", function() {
      global['@testLibrary']('sub', function ($import) {
        var self = $import('.');
        self.protectedValue = "secret!";
      });
      global['@testLibrary']('sub', function ($import) {
        var self = $import('.');
        return {
          secret: self.protectedValue,
          otherSub2: self.subTest
        };
      });
      expect(global['@testLibrary']('sub').secret).toEqual('secret!');
      expect(global['@testLibrary']('sub').otherSub2).toEqual('other value');
      expect(global['@testLibrary']('sub').hasOwnProperty('protectedValue')).toBe(false);
    });

    it("should detect a circular import", function() {
      global['@testLibrary']('sub/other', function ($import) {
        $import('/');
      });
      global['@testLibrary']('sub', function ($import) {
        $import('sub/other');
      });
      expect(function () {
        global['@testLibrary']();
      }).toThrow('Pathway: Circular import between: @testLibrary/sub/other and /');
    });

    it("should allow mutation of package objects", function() {
      global['@testLibrary']('sub').b = 'test';
      expect(global['@testLibrary']().sub.b).toEqual('test');
    });
  });

  describe("global values", function () {
    it("should import an property of the global object", function() {
      global.testVal = 123;
      global['@testLibrary'](function ($import) {
        return {
          test: $import('@testVal')
        };
      });
      expect(global['@testLibrary']().test).toEqual(123);
    });

    it("should error if it doesn't exist", function() {
      global['@testLibrary'](function ($import) {
        $import('@doesntExist');
      });
      expect(function () {
        global['@testLibrary']();
      }).toThrow('Pathway: Failed to import library: @doesntExist from @testLibrary/');
    });

    it("should be obtained from global prototype", function() {
      var test = (function () {
        function Test() {}
        Test.prototype.abc = 123;
        return new Test();
      })();
      makePathway('protoTest', test);
      test['@protoTest'](function ($import) {
        return {
          value: $import('@abc')
        };
      });
      var abc = test['@protoTest']();
      expect(abc.value).toEqual(123);
    });
  });

  describe("imports between libraries", function () {
    beforeEach(function () {
      makePathway('testLibrary2', global);
      global['@testLibrary']('a/b/c', function () {
        return {
          abc: 123
        };
      });
      global['@testLibrary2'](function ($import) {
        return {
          jackson5: $import('@testLibrary/a/b/c')
        };
      });
    });

    it("should import from another library", function () {
      expect(global['@testLibrary2']().jackson5.abc).toEqual(123);
    });

    it("should catch circular imports", function () {
      global['@testLibrary']('a/b/c', function ($import) {
        $import('@testLibrary2');
      });
      expect(function () {
        global['@testLibrary']('a/b/c');
      }).toThrow('Pathway: Circular import between: @testLibrary2/ and @testLibrary/a/b/c');
    });
  });
});