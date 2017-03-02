require.config('test/libs/');

require(['b.js'], function(b) {
  b.doSomething();
});