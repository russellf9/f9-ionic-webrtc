var gulp        = require('gulp'),
    config      = require('../../config'),
    path        = require('path'),
    inject = require('gulp-inject'),
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
        targetDir = path.resolve(build ? 'www' : '.tmp/test'),
        src = './app/index.html',
        files = build ? ['./www/js/**/*.js', './app/css/ionic.app.css'] : ['./app/js/**/*.js', './app/css/ionic.app.css'],
        sources = gulp.src(files, {read: false});

    gulp.src(src)
        .pipe(inject(sources))
        .pipe(gulp.dest(targetDir))
        .on('error', errorHandler);
    cb()
});

// Handle errors
function errorHandler(error) {
    console.log('Gulp index Error: ',error.toString());
    this.emit('end');
}