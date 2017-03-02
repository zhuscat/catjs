;(function cat(global) {
  var loadings = [];
  var modules = {};
  var catjs = {};
  var basePath = '';
  var configPath = '';

  catjs.loadJS = function loadJS(url, callback) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.onload = function() {
      callback && callback();
    }
    script.src = url;
    document.head.appendChild(script);
  };

  catjs.define = function define(deps, callback) {
    var id = catjs.getCurrentId();
    var depsId = [];
    deps.forEach(function(dep) {
      depsId.push(catjs.getScriptId(dep));
    });
    if (!modules[id]) {
      modules[id] = {
        id: id,
        state: 0,
        deps: depsId,
        factory: callback,
        exported: null,
      };
    }
  };

  catjs.require = function require(deps, callback) {
    var id = catjs.getCurrentId();
    var depIds = [];

    deps.forEach(function(dep) {
      depIds.push(catjs.getScriptId(dep));
    });

    if (!modules[id]) {
      modules[id] = {
        id: id,
        state: 0,
        deps: depIds,
        factory: callback,
        exported: null,
      };

      loadings.unshift(id);
    }

    catjs.loadDepModules(id);
  };

  catjs.loadDepModules = function loadDepModules(id) {
    modules[id].deps.forEach(function(dep) {
      if (!modules[dep]) {
        catjs.loadJS(dep, function() {
          loadings.unshift(dep);
          catjs.loadDepModules(dep);
          catjs.checkDeps();
        });
      }
    });
  };

  catjs.checkDeps = function checkDeps() {
    var i, j;
    var id, deps, allLoaded;
    for (i = 0; i < loadings.length; i++) {
      allLoaded = true;
      id = loadings[i];
      m = modules[id];
      deps = m.deps;
      catjs.checkCycle(deps, id);
      for (j = 0; j < deps.length; j++) {
        if (!modules[deps[j]] || modules[deps[j]].state !== 1) {
          allLoaded = false;
          break;
        }
      }
      if (allLoaded) {
        loadings.splice(i, 1);
        catjs.fireFactory(id);
        catjs.checkDeps();
      }
    }
  }

  catjs.checkCycle = function checkCycle(deps, id) {
    if (modules[id].state !== 1) {
      deps.forEach(function(dep) {
        if (modules[dep]) {
          modules[dep].deps.forEach(function(childDep) {
            if (childDep === id) {
              throw new Error('detect circular dependency');
            }
          });
          if (modules[dep].state !== 1) {
            catjs.checkCycle(modules[dep].deps, id);
          }
        }
      });
    }
  }

  catjs.fireFactory = function fireFactory(id) {
    var m = modules[id];
    var deps = m.deps;
    var callback = m.factory;
    var args = [];
    var i;
    deps.forEach(function(dep) {
      args.push(modules[dep].exported);
    });
    var ret = callback && callback.apply(global, args);
    if (ret) {
      m.exported = ret;
    }
    m.state = 1;

    return ret;
  }

  catjs.getCurrentId = function getCurrentId() {
    return document.currentScript.src;
  }

  catjs.getScriptId = function getScriptId(name) {
    return basePath + name;
  }

  catjs.init = function init() {
    var currentFile = catjs.getCurrentId();
    basePath = currentFile.replace(/[^\/]+\.js/i, '');
    var scripts = document.getElementsByTagName('script');
    var entry = scripts[scripts.length - 1].dataset.main;
    catjs.loadJS(entry);
  }

  catjs.require.config = function config(path) {
    basePath = basePath + path;
  }

  catjs.init();

  global.define = catjs.define;
  global.require = catjs.require;

})(window);