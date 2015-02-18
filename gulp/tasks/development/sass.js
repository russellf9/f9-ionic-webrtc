/**
  The SASS task, generates a CSS file and creates a minified version of that CSS file.
**/

var gulp        = require('gulp'),
    sass        = require('gulp-sass'),
    config      = require('../../config'),
    minifyCss   = require('gulp-minify-css'),
    autoprefixer = require('gulp-autoprefixer'),
    rename      = require('gulp-rename');


gulp.task('sass', function(done) {
    gulp.src(config.sass.src)
        .pipe(sass())
        .pipe(autoprefixer(config.sass.autoprefixer))
        .pipe(gulp.dest(config.sass.dest))
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(rename({ extname: '.min.css' }))
        .pipe(gulp.dest(config.sass.dest))
        .on('end', done);
});
