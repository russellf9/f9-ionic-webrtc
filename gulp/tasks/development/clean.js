var gulp        = require('gulp'),
    config      = require('../../config'),
    clean       = require('gulp-clean');

// cleans the distribution folder
gulp.task('clean', function(cb) {

    // TODO Add an array of directories?
    gulp.src('./.tmp/*')
        .pipe(clean({force: true})).on('error', errorHandler);
    cb()
});

// Handle errors
function errorHandler(error) {
    console.log(error.toString());
    this.emit('end');
}