var  _ = require('lodash'),
    pkg = require('../../../package.json'),
    gulp = require('gulp'),
    config = require('../../config'),
    template = require('gulp-template'),
    gulpIf = require('gulp-if'),
    path = require('path'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    argv = require('minimist')(process.argv.slice(2)),
    stripDebug = require('gulp-strip-debug'),
    header = require('gulp-header'),
    footer = require('gulp-footer'),
    gutil = require('gulp-util'),
    args = require('yargs')
        .alias('e', 'emulate')
        .alias('b', 'build')
        .alias('r', 'run')
        .default('build', false)
        .default('port', 9000)
        .argv;

// TODO  need to work out how to use the `minimist` plug-in ( so we can pass arguments on the CLI )
// TODO need to get the `template` module to work

// performs all required operations to distribute the js files
gulp.task('scripts', function(cb) {

    var build = args.build || args.emulate || args.run,

        //targetSrc = path.resolve(build ? './www/scripts/**/*.js' : './.tmp/scripts/**/*.js' ),
        // just use the actual app js files
        targetSrc = './app/js/**/*.js';


        targetDir = path.resolve(build ? './www/' : './.tmp/' );


    // ./.tmp/scripts/**/*.js
    // ./www/scripts/**/*.js


    return gulp.src(targetSrc)
        //.pipe(template({pkg: pkg}))
        .pipe(gulpIf(build, concat(config.scripts.name)))
        // task is really slow :-(
        //.pipe(gulpIf(config.scripts.IS_RELEASE_BUILD, stripDebug()))
        .pipe(header(config.build.closureStart))
        .pipe(footer(config.build.closureEnd))
        .pipe(header(config.build.banner))
        .pipe(gulp.dest(targetDir + '/js'))
        .pipe(gulpIf(build, uglify()))
        .pipe(rename({ extname: '.min.js' }))
        .pipe(header(config.build.banner))
        .pipe(gulp.dest(targetDir + '/js'));
    cb();
});

// NOTE - this simple text works, but not the `template` doesn't work above :-(
gulp.task('test-template', function() {
    return gulp.src('./src/greeting.html')
        .pipe(template({pkg: pkg}))
        .pipe(gulp.dest(config.scripts.dist));
});