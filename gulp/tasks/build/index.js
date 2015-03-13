'use strict';

var gulp = require('gulp'),
    config = require('../../config'),
    path = require('path');

// injects the path of the js and css files into the `target` html file
gulp.task('index', function(cb) {

    //plugins.log('stuff happened', 'Really it did', plugins.colors.magenta('123'));
    //gutil.log('plugins: ',plugins);
    gulp.plugins.util.log('Index - I`m working! build: ', gulp.args.build);

    // note:  config.paths.target = browserPlatform = './platforms/browser/www'
    //

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
    // define the src and target
        src = './app/index.html',
        targetDir = path.resolve(build ? 'www' : config.paths.target),

    // define the path for each build
        cssPath = path.resolve(build ? 'www/styles/main.css' : config.paths.target + '/styles/main.css'),
        vendorPath = path.resolve(build ? 'www/js/vendor.js' : config.paths.target + '/js/vendor.js'),
        appPath = path.resolve(build ? 'www/js/app.min.js'   : config.paths.target + '/js/app.min.js'),

    // define the stream for each build
        cssStream = gulp.src([cssPath], {read: false}),
        vendorStream = gulp.src([vendorPath], {read: false}),
        appStream = gulp.src([appPath], {read: false}),

    // define options to pass to the `inject` task
        options = {addRootSlash: false},
        vendorOptions = {addRootSlash: false, starttag: '<!-- inject:head:{{ext}} -->'};

    // ignore the root path according to which build
    options.ignorePath = build ? 'www' : 'platforms/browser/www/';
    vendorOptions.ignorePath = build ? 'www' : 'platforms/browser/www/';

    gulp.src(src)
        .pipe(gulp.plugins.inject(cssStream, options))
        .pipe(gulp.plugins.inject(vendorStream, vendorOptions))
        .pipe(gulp.plugins.inject(appStream, options))
        .pipe(gulp.plugins.print())
        .pipe(gulp.dest(targetDir))
        .on('error', errorHandler);
    cb();
});

// Handle errors
function errorHandler(error) {
    console.log('Gulp index Error: ', error.toString());
    /*jshint validthis:true */
    this.emit('end');
}
