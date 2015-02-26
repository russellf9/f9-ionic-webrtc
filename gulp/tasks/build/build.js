var gulp        = require('gulp'),
    runSequence = require('run-sequence');

// Run all tasks needed for a build
// the 'clean' task completes first,
// then the 'distribute' tasks are run in parallel
// lastly the html files are copied

// note: - Using [run-sequence](https://www.npmjs.com/package/run-sequence)
// a temporary solution!

gulp.task('build', function(cb) {

    console.log('args: ', gulp.args)

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        emulate = gulp.args.emulate;


    runSequence('clean',
        ['jsHint', 'scripts', 'vendor', 'styles', 'images', 'fonts'],
        'index', 'partials',
        build ? 'noop' : 'watchers',
        build ? 'noop' : 'serve',
        emulate ? 'ionic:emulate' : 'noop',
        cb);
});
