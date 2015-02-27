'use strict';

var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    config = require('../../config'),
    path = require('path'),
    streamqueue = require('streamqueue');

// performs operations to distribute the css files
gulp.task('styles', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        options = config.sass.options;

    options.style = build ? 'compressed' : 'expanded';

    var cssPaths = ['./bower_components/ionic/css/ionic.min.css',
        './bower_components/jquery-ui/themes/ui-lightness/jquery-ui.css'],
        sassStream = gulp.plugins.rubySass(config.sass.rubySrc, options)
            .pipe(gulp.plugins.autoprefixer(config.sass.autoprefixer))
            .on('error', errorHandler),
        cssStream = gulp.src(cssPaths),
        targetDir = path.resolve(build ? './www' : './.tmp');

    return streamqueue({objectMode: true}, cssStream, sassStream)
        .pipe(gulp.plugins.concat('main.css'))
        //.pipe(plugins.if(build, plugins.stripCssComments()))
        //.pipe(plugins.if(build, plugins.rev()))
        .pipe(gulp.dest(path.join(targetDir, 'styles')))
        .on('error', errorHandler)
        .pipe(gulp.plugins.notify({
            title: 'SASS',
            message: 'SASS completed.  New CSS created!',
            sound: 'Pop'
        }));
});


// Handle errors
function errorHandler(error) {
    console.log('Gulp Styles Error: ', error.toString());
    /*jshint validthis:true */
    this.emit('end');
}
/**
 TODO;

 add notify
 .pipe(notify({
        title: 'SASS',
        message: 'SASS completed.  New CSS created!',
        sound: 'Pop'
    }));
 */
