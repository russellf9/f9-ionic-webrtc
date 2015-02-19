/**
  The SASS task, generates a CSS file and creates a minified version of that CSS file.


 Notes: not sure about the `source-maps` and how to add the options with the new syntax.
**/

var gulp        = require('gulp'),
    plumber      = require('gulp-plumber'),
    gulpFilter   = require('gulp-filter'),
    sass        = require('gulp-ruby-sass'),
    sourcemaps   = require('gulp-sourcemaps'),
    config      = require('../../config'),
    minifyCss   = require('gulp-minify-css'),
    autoprefixer = require('gulp-autoprefixer'),
    rename      = require('gulp-rename');


gulp.task('sass', function(done) {

    // Don’t write sourcemaps of sourcemaps
    var filter = gulpFilter(['*.css', '!*.map']),

        sassConfig = config.sass.options;
//
    return sass(config.sass.src, { style: 'expanded' })
        .pipe(sourcemaps.init())
        .pipe(autoprefixer(config.sass.autoprefixer))
        .pipe(filter) // Don’t write sourcemaps of sourcemaps
        .pipe(sourcemaps.write('.', { includeContent: false }))
        .pipe(filter.restore()) // Restore original files
        .pipe(gulp.dest(config.sass.dest));
});

