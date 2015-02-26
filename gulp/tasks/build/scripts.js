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


    console.log('val: ', pkg.version);
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

// NOTE - this simple text works, but not the `template` doesn't work above :-(
gulp.task('test-template', function() {
    return gulp.src('./src/greeting.html')
        .pipe(gulp.plugins.template({pkg: pkg}))
        .pipe(gulp.dest(config.scripts.dist));
});

// NOTE - this simple text works, but not the `template` doesn't work above :-(
gulp.task('test-banner', function() {
    return gulp.src('./src/greeting.html')
        .pipe(gulp.plugins.header(config.build.banner, {pkg: pkg}))
        .pipe(gulp.dest(config.scripts.dist));
});

gulp.task('test-banner', function() {
    return gulp.src('./src/greeting.html')
        .pipe(gulp.plugins.header(config.build.banner, {pkg: pkg}))
        .pipe(gulp.dest(config.scripts.dist));
});




