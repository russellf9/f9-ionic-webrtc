//see: http://stefanimhoff.de/2014/gulp-tutorial-1-intro-setup/
var gulp = require('gulp'),
    requireDir = require('require-dir'),
    plugins = require('gulp-load-plugins')({
        pattern: ['gulp-*', 'gulp.*'],
        scope: ['dependencies', 'devDependencies', 'peerDependencies'],
        replaceString: /\bgulp[\-.]/
    }),
    args = require('yargs')
        .alias('e', 'emulate')
        .alias('b', 'build')
        .alias('r', 'run')
        .default('build', false)
        .default('port', 9000)
        .argv;


// Require all tasks in gulp/tasks, including subfolders
var tasks = requireDir('./gulp/tasks', { recurse: true });

// assign the plugins to the `cached response`
gulp.plugins = plugins;

// assign the args to the `cached response`
gulp.args = args;

//
gulp.vendorFiles = require('./vendor.json');


// error handler
gulp.errorHandler = function(task, error) {
    gulp.plugins.util.log('Gulp - ', task, ' - error: ', error);
};





