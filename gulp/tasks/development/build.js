var gulp        = require('gulp'),
    config      = require('../../config'),
    runSequence = require('run-sequence');

// Run all tasks needed for a build
// 'clean' first, 'distribute', 'fonts' in parallel
// and 'scripts` last
// note: - Using [run-sequence](https://www.npmjs.com/package/run-sequence)
// a temporary solution!

gulp.task('build', function(cb) {
    runSequence('clean',
        ['scripts', 'vendor', 'styles', 'fonts'],
        'index', 'partials',
        cb);
});
