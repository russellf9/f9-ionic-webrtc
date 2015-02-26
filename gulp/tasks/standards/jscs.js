'use strict';

var gulp = require('gulp'),
    config = require('../../config'),
    jscs = require('jscs');

// lint js sources based on .jshintrc ruleset
gulp.task('jscs', function() {
    return gulp.src('app/js/**/*.js')
        .pipe(jscs());
});




// Handle errors
function errorHandler(error) {
    console.log('Gulp jsHint Error: ', error.toString());
    /*jshint validthis:true */
    this.emit('end');
}
