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

// injects the path of the js and cs files into the `target` html file
gulp.task('index', function(cb) {
    
    var build = args.build || args.emulate || args.run,
        // define the src and target
        src = './app/index.html',
        targetDir = path.resolve(build ? 'www' : '.tmp'),

        // define the path for each build
        cssPath = path.resolve(build ? 'www/styles/main.css' : '.tmp/styles/main.css'),
        vendorPath = path.resolve(build ? 'www/js/vendor.js' : '.tmp/js/vendor.js'),
        appPath = path.resolve(build ? 'www/js/app.js' : '.tmp/js/app.js'),

        // define the stream for each build
        cssStream = gulp.src([cssPath], {read: false}),
        vendorStream = gulp.src([vendorPath], {read: false}),
        appStream = gulp.src([appPath], {read: false}),

        // define options to pass to the `inject` task
        options =  {ignorePath: '.tmp', addRootSlash: false},
        vendorOptions = {ignorePath: '.tmp', addRootSlash: false, starttag: '<!-- inject:head:{{ext}} -->'};

    gulp.src(src)
        .pipe(inject(cssStream, options))
        .pipe(inject(vendorStream, vendorOptions))
        .pipe(inject(appStream, options))
        .pipe(print())
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