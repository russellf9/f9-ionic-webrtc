var gulp        = require('gulp'),
    config      = require('../../config'),
    usemin = require('gulp-usemin'),
    minifyHTML = require('gulp-minify-html'),
    useref = require('gulp-useref');

gulp.task('distribute', function(cb) {

    var assets = useref.assets();

    var condition = 'app.js';

    console.log('path: ', config.build.html);

    return gulp.src('./www/**/*.html')
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(config.scripts.dist));
    cb()
});