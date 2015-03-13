'use strict';

var gulp = require('gulp'),
    config = require('../../config'),
    noop = function () {},
    jscs = require('jscs'),
    stylish = require('gulp-jscs-stylish');

// lint js sources based on .jshintrc ruleset
gulp.task('jscs', function() {
    gulp.src('./app/js/app.js')
        .pipe(jscs())
        .on('error', noop) // don't stop on error
        .pipe(stylish());  // log style errors
});
/*
return gulp.src('src/app.js')

.pipe(jscs())
 */






// Handle errors
function errorHandler(error) {
    console.log('Gulp jsHint Error: ', error.toString());
    /*jshint validthis:true */
    this.emit('end');
}
