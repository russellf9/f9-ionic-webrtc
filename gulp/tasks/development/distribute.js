/**
    A task which distributes and creates scripts from `run blocks`
*/

var gulp        = require('gulp'),
    config      = require('../../config'),
    useref      = require('gulp-useref');

gulp.task('distribute', function(cb) {

    var assets = useref.assets();

    return gulp.src(config.scripts.html)
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(config.scripts.dist));
    cb()
});