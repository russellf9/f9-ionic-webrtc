var gulp    = require('gulp'),
    config  = require('../../config'),
    path    = require('path');


// cleans the distribution folder
gulp.task('clean', function(cb) {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        targetDir = path.resolve(build ? './www' : './.tmp');

    gulp.src(targetDir)
        .pipe(gulp.plugins.clean({force: true, read: false})).on('error', errorHandler);
    cb()
});

// Handle errors
function errorHandler(error) {
    console.log('Gulp Clean Error: ',error.toString());
    this.emit('end');
}