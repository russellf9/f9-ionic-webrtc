var gulp    = require('gulp'),
    config  = require('../../config'),
    path    = require('path');


// copy images
gulp.task('images', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        targetDir = path.resolve(build ? './www/' : './.tmp/' );

    return gulp.src(config.paths.images)
        .pipe(gulp.dest(path.join(targetDir, 'img')))

        .on('error', function(error) {
            gulp.errorHandler('images', error);
        });
});
