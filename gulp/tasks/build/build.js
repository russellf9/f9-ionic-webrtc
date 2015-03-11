'use strict';

var gulp = require('gulp'),
    runSequence = require('run-sequence'),
    notifier = require('node-notifier');


// Run all tasks needed for a build
// the 'clean' task completes first,
// then the 'distribute' tasks are run in parallel
// lastly the html files are copied

// note: - Using [run-sequence](https://www.npmjs.com/package/run-sequence)
// a temporary solution!

gulp.task('build', function(cb) {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        emulate = gulp.args.emulate,
        run = gulp.args.run;

    // if we just use emulate or run without specifying platform, we assume iOS
    // in this case the value returned from yargs would just be true
    if (emulate === true) {
        emulate = 'ios';
    }
    if (run === true) {
        run = 'ios';
    }

    runSequence('clean',
        ['jshint', 'scripts', 'vendor', 'styles', 'images'],
        'index', 'partials', 'fonts',
        build ? 'noop' : 'watchers',
        build ? 'noop' : 'serve',
        emulate ? 'ionic:emulate' : 'noop',
        run ? 'ionic:run' : 'noop',
        'notify:build-success',
        cb);

});


// a sub task to run the success notification
gulp.task('notify:build-success', function() {

    notifier.notify({
        title: 'Build',
        message: 'Build task completed.  A new app has been created!',
        sound: 'Pop'
    });
});
