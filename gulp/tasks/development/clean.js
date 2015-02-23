var gulp        = require('gulp'),
    config      = require('../../config'),
    clean       = require('gulp-clean'),
    path = require('path'),
    args = require('yargs')
        .alias('e', 'emulate')
        .alias('b', 'build')
        .alias('r', 'run')
        .default('build', false)
        .default('port', 9000)
        .argv;

// cleans the distribution folder
gulp.task('clean', function(cb) {

    var build = args.build || args.emulate || args.run;

        targetDir = path.resolve(build ? './www/*' : './.tmp/*');

    // TODO Add an array of directories?
    gulp.src(targetDir)
        .pipe(clean({force: true})).on('error', errorHandler);
    cb()
});

// Handle errors
function errorHandler(error) {
    console.log(error.toString());
    this.emit('end');
}