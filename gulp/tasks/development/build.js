var gulp        = require('gulp'),
    config = require('../../config');

/**
 * Run all tasks needed for a build
 */
gulp.task('build', ['bundle', 'sass']);
