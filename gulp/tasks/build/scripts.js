'use strict';

var pkg = require('../../../package.json'),
    gulp = require('gulp'),
    config = require('../../config'),
    path = require('path');

// performs all required operations to distribute the js files
gulp.task('scripts', function(cb) {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        targetSrc = config.paths.scripts,
        targetDir = path.resolve(build ? './www/' : './.tmp/');

    return gulp.src(targetSrc)
        .pipe(gulp.plugins.concat(config.scripts.name))
        .pipe(gulp.plugins.if(build, gulp.plugins.stripDebug()))
        .pipe(gulp.plugins.header(config.build.closureStart))
        .pipe(gulp.plugins.footer(config.build.closureEnd))
        .pipe(gulp.plugins.if(build, gulp.plugins.rename({extname: '.min.js'})))
        .pipe(gulp.plugins.if(build, gulp.plugins.uglify()))
        .pipe(gulp.plugins.header(config.build.banner, {pkg: pkg}))
        .pipe(gulp.dest(targetDir + '/js'));
    cb();
});





