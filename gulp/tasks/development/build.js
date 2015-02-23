var gulp        = require('gulp'),
    config      = require('../../config'),

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

console.log('arg - build: ', build);
console.log('arg - port: ', port);


// Run all tasks needed for a build
gulp.task('build', ['clean', 'distribute', 'fonts']);
