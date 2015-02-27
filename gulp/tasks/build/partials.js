'use strict';

var gulp    = require('gulp'),
    config  = require('../../config'),
    path    = require('path');

// copies the partials
gulp.task('partials', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        src = './app/partials/**/*.html',
        targetDir = path.resolve(build ? './www/' : './.tmp/');

    gulp.src(src)
        .pipe(gulp.dest(path.join(targetDir, 'partials')));
});
