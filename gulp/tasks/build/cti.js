'use strict';

var pkg = require('../../../package.json'),
    gulp = require('gulp'),
    config = require('../../config'),
    path = require('path');

// just deploys the `simpleCTI.js` file
gulp.task('cti', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        ctiSrc = config.paths.ctiJs,
        targetDir = path.resolve(build ? './www/' : config.paths.target);
    return gulp.src([ctiSrc])
        .pipe(gulp.dest(targetDir + '/js'));
});