var gulp = require('gulp'),
    path = require('path'),
    args = require('yargs')
        .alias('e', 'emulate')
        .alias('b', 'build')
        .alias('r', 'run')
        .default('build', false)
        .default('port', 9000)
        .argv;

gulp.task('fonts', function(cb) {

    var build = args.build || args.emulate || args.run,
        targetDir = path.resolve(build ? 'www' : '.tmp');

    gulp.src(['app/fonts/*.*', 'bower_components/ionic/fonts/*.*'])
        .pipe(gulp.dest(path.join(targetDir, 'fonts')))
        .on('error', errorHandler);
    cb()
});

// error handler
var errorHandler = function(error) {
    //if (build || prePush) {
    //    throw error;
    //} else {
    //    beep(2, 170);
    //    plugins.util.log(error);
    //}

    console.log(error);
};


