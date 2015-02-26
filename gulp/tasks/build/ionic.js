'use strict';

var gulp = require('gulp'),
    shell = require('gulp-shell');

// ionic emulate wrapper
gulp.task('ionic:emulate', shell.task([
    'ionic emulate ' + 'ios'
]));

// ionic run wrapper
gulp.task('ionic:run', shell.task([
    'ionic run ' + 'ios'
]));
