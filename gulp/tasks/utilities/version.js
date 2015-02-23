/* A task to `bump` the apps version number */

var gulp = require('gulp'),
    config = require('../../config'),
    bump = require('gulp-bump'),
    packageJSON  = config.json.package,
    bowerJSON = config.json.bower,
    json = [packageJSON, bowerJSON];

// implements semantic a `minor` increment
gulp.task('bump-minor', function(){
    gulp.src(json)
        .pipe(bump({type:'minor'}))
        .pipe(gulp.dest('./'));
});

// implements a semantic `major` increment
gulp.task('bump-major', function(){
    gulp.src(json)
        .pipe(bump({type:'major'}))
        .pipe(gulp.dest('./'));
});

// implements a semantic `patch` increment
gulp.task('bump-patch', function(){
    gulp.src(json)
        .pipe(bump({type:'patch'}))
        .pipe(gulp.dest('./'));
});


