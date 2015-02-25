var gulp = require('gulp'),
    config = require('../../config');


config.sass.IS_WATCH = false;

gulp.task('watch', function() {
    config.sass.IS_WATCH = true;
    gulp.watch(config.sass.src, ['sass']);
});