var gulp        = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    config      = require('../../config'),
    template = require('gulp-template'),
    gulpIf = require('gulp-if'),
    path = require('path'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    streamqueue = require('streamqueue'),

    args = require('yargs')
        .alias('e', 'emulate')
        .alias('b', 'build')
        .alias('r', 'run')
        .default('build', false)
        .default('port', 9000)
        .argv;

//
gulp.task('styles', function(cb) {

    var build = args.build || args.emulate || args.run,

        sassConfig = config.sass.options;

    var options = build ?
    { style: 'compressed' } :
    { style: 'expanded' };

    var sassStream = plugins.rubySass(config.sass.rubySrc, options)
        .pipe(plugins.autoprefixer(config.sass.autoprefixer));

    var cssStream = gulp
        .src('./bower_components/ionic/css/ionic.min.css'),
        targetDir = path.resolve(build ? './www' : './.tmp');

    return streamqueue({ objectMode: true }, cssStream, sassStream)
        .pipe(concat('main.css'))
        //.pipe(plugins.if(build, plugins.stripCssComments()))
        //.pipe(plugins.if(build, plugins.rev()))
        .pipe(gulp.dest(path.join(targetDir, 'styles')))
        .on('error', errorHandler);
    cb();
});


// Handle errors
function errorHandler(error) {
    console.log('Gulp Styles Error: ',error.toString());
    this.emit('end');
}