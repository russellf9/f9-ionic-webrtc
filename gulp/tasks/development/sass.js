/**
  A simple SASS task
**/

var gulp        = require('gulp'),
    sass        = require('gulp-sass'),
    config      = require('../../config'),
    autoprefixer = require('gulp-autoprefixer');

gulp.task('sass', function() {
    console.log('basic-sass src: ', config.sass.src);
    console.log('basic-sass destination: ', config.sass.dest);

    var sassConfig = config.sass.options;

//    gulp.src(config.sass.src)
//        .pipe(sass())
//        .pipe(autoprefixer(config.autoprefixer))
//        .pipe(gulp.dest(config.sass.dest));

});
