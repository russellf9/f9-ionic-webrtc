'use strict';

var pkg = require('../../../package.json'),
    gulp = require('gulp'),
    config = require('../../config'),
    path = require('path');

// just deploys the `simpleCTI.js` file
gulp.task('api', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        apiSrc = config.paths.apiJs,
        targetDir = path.resolve(build ? './www/' : config.paths.target);
    return gulp.src([apiSrc])
        .pipe(gulp.dest(targetDir + '/js'));
});