'use strict';

var gulp = require('gulp'),
    config = require('../../config'),
    path = require('path'),
    browserSync = require('browser-sync'),
    reload      = browserSync.reload;

gulp.task('watchers', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run;

    gulp.watch(config.paths.sass, ['styles']);

    // TODO not working...
    //gulp.watch(config.paths.fonts, ['fonts']);

    // TODO
    // gulp.watch('app/icons/**', ['iconfont']);

    // TODO
    // gulp.watch('app/images/**', ['images'])

    gulp.watch(config.paths.scripts, ['jshint', 'scripts', 'index']).on('error', errorHandler);
    gulp.watch(config.paths.vendor, ['vendor']).on('error', errorHandler);
    gulp.watch(config.paths.partials, ['scripts', 'index', 'partials']).on('error', errorHandler);
    gulp.watch(config.paths.index, ['index']).on('error', errorHandler);


    // handles the refreshing
    // the tasks above will place new files into the target directory
    browserSync({
        server: config.paths.target
    });

    // reloads the browser on any change to the target directory
    gulp.watch(config.paths.target+ '/**/*').on('change', reload);

});


// Handle errors
function errorHandler(error) {
    console.log('Gulp Watchers Error: ', error.toString());
    /*jshint validthis:true */
    this.emit('end');
}


