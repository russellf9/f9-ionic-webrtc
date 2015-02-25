var gulp = require('gulp'),
    config = require('../../config'),
    path = require('path'),
    connect = require('gulp-connect');

// start local server
gulp.task('serve', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        port = gulp.args.port || 9000,
        targetDir = path.resolve(build ? 'www' : '.tmp');

    connect.server({
        root: targetDir,
        port: port,
        livereload: true
    });
});
