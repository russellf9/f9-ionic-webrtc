var gulp = require('gulp'),
    config = require('../../config'),
    path = require('path'),
    livereload = require('connect-livereload');

gulp.task('watchers', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        targetDir = path.resolve(build ? 'www' : '.tmp');

    gulp.plugins.util.log('watchers! ');

    //TODO
    //livereload.listen();

    gulp.watch(config.paths.sass, ['styles']);
    // TODO not working...
    gulp.watch(config.paths.fonts, ['fonts']);

    // TODO
    // gulp.watch('app/icons/**', ['iconfont']);

    // TODO
    // gulp.watch('app/images/**', ['images'])

    gulp.watch(config.paths.scripts, ['jsHint', 'scripts', 'index']);
    gulp.watch(config.paths.vendor, ['vendor']);
    gulp.watch(config.paths.partials, ['scripts', 'index']);
    gulp.watch(config.paths.index, ['index']);


    //gulp.watch(targetDir + '/**')
    //    .on('change', gulp.plugins.livereload.changed)
    //    .on('error', function(error) {
    //        gulp.plugins.util.log(error);
    //    });

});

