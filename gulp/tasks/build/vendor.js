'use strict';

var gulp = require('gulp'),
    config = require('../../config'),
    path = require('path');

// performs all required operations to distribute the vendor js files
gulp.task('vendor', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        targetDir = path.resolve(build ? './www/' : './.tmp/');

    return gulp.src(gulp.vendorFiles,
        {base: 'bower_components/'})
        .pipe(gulp.plugins.concat('vendor.js'))
        .pipe(gulp.plugins.if(build, gulp.plugins.uglify())
            //.pipe(gulp.plugins.if(build, plugins.rev())) // could do this
            .pipe(gulp.dest(path.join(targetDir, 'js')))
            .on('error', errorHandler));
});


// Handle errors
function errorHandler(error) {
    console.log('Gulp Vendor Error: ', error.toString());
    /*jshint validthis:true */
    this.emit('end');
}
