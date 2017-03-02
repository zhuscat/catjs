define(['c.js'], function(c) {
  return {
    doSomething: function() {
      console.log('function in a is called');
      c.doSomething();
    },
  };
});