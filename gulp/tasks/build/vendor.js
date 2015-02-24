var gulp        = require('gulp'),
    config      = require('../../config'),
    template = require('gulp-template'),
    gulpIf = require('gulp-if'),
    path = require('path'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    header = require('gulp-header'),
    footer = require('gulp-footer'),
    gutil = require('gulp-util'),
    //vendorFiles = require('./vendor.json'),
    gs = require('glob-stream'),
    args = require('yargs')
        .alias('e', 'emulate')
        .alias('b', 'build')
        .alias('r', 'run')
        .default('build', false)
        .default('port', 9000)
        .argv;

// performs all required operations to distribute the vendor js files
gulp.task('vendor', function(cb) {

    var build = args.build || args.emulate || args.run,
    // unable to load the json file as a node package :-(
       // vendorFiles = require('./test.json'),
    targetDir = path.resolve(build ? './www/' : './.tmp/' ),

    // nasty hack for now :-(
    files = ['./bower_components/jquery/dist/jquery.js',
        './bower_components/jquery-ui/jquery-ui.js',
        './bower_components/jqueryui-touch-punch/jquery.ui.touch-punch.js',
        './bower_components/ionic/js/ionic.bundle.js',
        './bower_components/angular-touch/angular-touch.js',
        './bower_components/angular-animate/angular-animate.js',
        './bower_components/angular-dragdrop/src/angular-dragdrop.js',
        './bower_components/lodash/lodash.js',
        './bower_components/angular-filter/dist/angular-filter.js'];

    return gulp.src(files,
        {base: 'bower_components/'})
        .pipe(concat('vendor.js'))
        .pipe(gulpIf(build, uglify())
        //.pipe(gulpIf(build, plugins.rev())) // could do this

        .pipe(gulp.dest(targetDir + '/test'))

        .on('error', errorHandler));
    cb();
});


// Handle errors
function errorHandler(error) {
    console.log('Gulp Vendor Error: ',error.toString());
    this.emit('end');
}