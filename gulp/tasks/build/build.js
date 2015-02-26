var gulp        = require('gulp'),
    runSequence = require('run-sequence');

// Run all tasks needed for a build
// the 'clean' task completes first,
// then the 'distribute' tasks are run in parallel
// lastly the html files are copied

// note: - Using [run-sequence](https://www.npmjs.com/package/run-sequence)
// a temporary solution!

gulp.task('build', function(cb) {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run;


    runSequence('clean',
        ['jsHint', 'scripts', 'vendor', 'styles', 'fonts'],
        'index', 'partials',
        build ? 'noop' : 'watchers',
        cb);
});