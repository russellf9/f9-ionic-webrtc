var gulp = require('gulp'),
    config = require('../../config'),
    livereload = require('connect-livereload');

gulp.task('watchers', function() {

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



});

