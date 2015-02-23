var gulp = require('gulp'),
    path = require('path');

gulp.task('fonts', function(cb) {

    var build = false,
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


