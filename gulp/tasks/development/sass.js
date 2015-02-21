/**
 The SASS task, generates a CSS file and creates a minified version of that CSS file.


 Notes: not sure about the `source-maps` and how to add the options with the new syntax.
 **/

var gulp = require('gulp'),
    plumber = require('gulp-plumber'),
    gulpFilter = require('gulp-filter'),
    sass = require('gulp-sass'),
    rubySass = require('gulp-ruby-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    config = require('../../config'),
    minifyCss = require('gulp-minify-css'),
    autoprefixer = require('gulp-autoprefixer'),
    rename = require('gulp-rename'),
    notify = require('gulp-notify'),
    through = require('through-gulp');


gulp.task('sass', function(done) {

    // Don’t write sourcemaps of sourcemaps
    var filter = gulpFilter(['*.css', '!*.map']),

        sassConfig = config.sass.options;

    return rubySass(config.sass.rubySrc, {style: 'expanded'})
        .on('error', function(err) {
            notify.onError({
                title: 'SASS Error!',
                message: '<%= error.message %>',
                sound: 'Beep'
            })(err);
            this.emit('end');
        })
        .pipe(autoprefixer(config.sass.autoprefixer))
        .pipe(gulp.dest(config.sass.rubyDest))
        .pipe(notify({
            title: 'SASS',
            message: 'SASS completed.  New CSS created!',
            sound: 'Pop'
        }));

});
// TODO do we need to set the sourcemap?


// options? , sourcemapPath: '../../scss'
//    return sass(config.sass.src, { style: 'expanded', sourcemap: true })
//        .pipe(sourcemaps.init())
//        .pipe(autoprefixer(config.sass.autoprefixer))
//        //.pipe(filter) // Don’t write sourcemaps of sourcemaps
//        //.pipe(sourcemaps.write('.', { includeContent: false }))
//        //.pipe(filter.restore()) // Restore original files
//        .pipe(gulp.dest(config.sass.dest));


