define(['a.js'], function(a) {
  return {
    doSomething: function() {
      console.log('function in b called');
      a.doSomething();
    },
  };
});