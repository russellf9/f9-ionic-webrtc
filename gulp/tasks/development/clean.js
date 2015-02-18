var gulp        = require('gulp'),
    config      = require('../../config'),
    clean       = require('gulp-clean');

// cleans the distribution folder
gulp.task('clean', function(cb) {
    gulp.src(config.build.dist+'/*')
        .pipe(clean({force: true})).on('error', errorHandler);
    cb()
});

// Handle errors
function errorHandler(error) {
    console.log(error.toString());
    this.emit('end');
}