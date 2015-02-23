var  _ = require('lodash'),
    pkg = require('../../../package.json'),
    gulp = require('gulp'),
    config = require('../../config'),
    template = require('gulp-template'),
    gulpIf = require('gulp-if'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    argv = require('minimist')(process.argv.slice(2)),
    stripDebug = require('gulp-strip-debug'),
    header = require('gulp-header'),
    footer = require('gulp-footer'),
    gutil = require('gulp-util');

// TODO  need to work out how to use the `minimist` plug-in ( so we can pass arguments on the CLI )
// TODO need to get the `template` module to work

// performs all required operations to distribute the js files
gulp.task('scripts', function() {
    return gulp.src(config.scripts.testSrc)
        //.pipe(template({pkg: pkg}))
        .pipe(concat(config.scripts.name))
        // task is really slow :-(
        //.pipe(gulpIf(config.scripts.IS_RELEASE_BUILD, stripDebug()))
        .pipe(header(config.build.closureStart))
        .pipe(footer(config.build.closureEnd))
        .pipe(header(config.build.banner))
        .pipe(gulp.dest(config.scripts.dist + '/js'))
        .pipe(gulpIf(config.scripts.IS_RELEASE_BUILD, uglify()))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(header(config.build.banner))
        .pipe(gulp.dest(config.scripts.dist + '/js'));
});

// NOTE - this simple text works, but not the `template` doesn't work above :-(
gulp.task('test-template', function() {
    return gulp.src('./src/greeting.html')
        .pipe(template({pkg: pkg}))
        .pipe(gulp.dest(config.scripts.dist));
});