/* A task to `bump` the apps version number using
    MAJOR.MINOR.PATCH
 * */

var gulp = require('gulp'),
    config = require('../../config'),
    packageJSON = config.json.package,
    bowerJSON = config.json.bower,
    json = [packageJSON, bowerJSON];


// implements a semantic `patch` increment
gulp.task('version-patch', function() {
    gulp.src(json)
        .pipe(gulp.plugins.bump({type: 'patch'}))
        .pipe(gulp.dest('./'));
});

// implements semantic a `minor` increment
gulp.task('version-minor', function() {
    gulp.src(json)
        .pipe(gulp.plugins.bump({type: 'minor'}))
        .pipe(gulp.dest('./'));
});

// implements a semantic `major` increment
gulp.task('version-major', function() {
    gulp.src(json)
        .pipe(gulp.plugins.bump({type: 'major'}))
        .pipe(gulp.dest('./'));
});



