var gulp        = require('gulp'),
    config      = require('../../config'),
    runSequence = require('run-sequence');

/**
 * Parse arguments
 */
    args = require('yargs')
    .alias('e', 'emulate')
    .alias('b', 'build')
    .alias('r', 'run')
    .default('build', false)
    .default('port', 9000)
    .argv;


var build = args.build || args.emulate || args.run;
var emulate = args.emulate;
var run = args.run;
var port = args.port;

console.log('build - arg - build: ', build);
console.log('build - arg - port: ', port);


// Run all tasks needed for a build
// 'clean' first, 'distribute', 'fonts' in parallel
// and 'scripts` last
// note: - Using [run-sequence](https://www.npmjs.com/package/run-sequence)
// a temporary solution!

gulp.task('build', function(cb) {
    runSequence('clean',
        ['scripts', 'vendor', 'styles', 'fonts'],
        'index',
        cb);
});
