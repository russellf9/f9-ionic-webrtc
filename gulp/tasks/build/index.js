var gulp        = require('gulp'),
    config      = require('../../config'),
    path        = require('path'),
    inject      = require('gulp-inject'),
    print = require('gulp-print'),
    gutil = require('gulp-util'),
    args = require('yargs')
        .alias('e', 'emulate')
        .alias('b', 'build')
        .alias('r', 'run')
        .default('build', false)
        .default('port', 9000)
        .argv;

// injects js and cs files into the source html file
gulp.task('index', function(cb) {


    var build = args.build || args.emulate || args.run,
        targetDir = path.resolve(build ? 'www' : '.tmp'),
        src = './app/index.html',
        files = build ? ['./www/js/**/*.js', './app/css/ionic.app.css'] : ['./app/js/**/*.js', './app/css/ionic.app.css'],
        sources = gulp.src(files);

    /// see: https://cameronspear.com/blog/streams-in-wiredep/
    // the vendor has already been made ( TODO )
    var vendorStream = gulp.src(['./.tmp/vendor.js']);

    var appStream = gulp.src(['./app/js/**/*.js']);


    // './app/css/ionic.app.css'
///Users/russellwenban/localhosts/www.factornine.co.uk/development/magic-squares-mobile/.tmp/styles/main.css

    gulp.src(src)
        //.pipe(inject( appStream))
        .pipe(inject(gulp.src(['.tmp/styles/main.css'], {read: false}), {ignorePath: '.tmp', addRootSlash: false} ))
        .pipe(inject(gulp.src(['.tmp/js/vendor.js'], {read: false}),  {ignorePath: '.tmp', addRootSlash: false, starttag: '<!-- inject:head:{{ext}} -->'}))
        .pipe(inject(gulp.src(['.tmp/js/app.js'], {read: false}), {ignorePath: '.tmp', addRootSlash: false}))
        .pipe( print() )
        .pipe(gulp.dest(targetDir))
        .on('error', errorHandler);
    cb()
});

// Handle errors
function errorHandler(error) {
    console.log('Gulp index Error: ',error.toString());
    this.emit('end');
}


/**
 .pipe(inject(gulp.src('./app/css/ionic.app.css', {ignorePath: 'app/', addRootSlash: false}, {read: false})))
 .pipe(inject(gulp.src(['./app/js/app.js'], {read: false}), {ignorePath: 'app/', addRootSlash: false}, {starttag: '<!-- inject:head:{{ext}} -->'}))
 .pipe(inject(gulp.src(['./app/js/**/

//*.js', '!./app/js/app.js'], {ignorePath: 'app/', addRootSlash: false}, {read: false})))
// {ignorePath: 'app/', addRootSlash: false}
// {read: false},

//  <link rel="stylesheet" href="styles/main.css">