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


// notes:-
// some issue with the directory path?
// I'm now using top level without a glob
// error every second time:
// "...Unable to delete "/Users/russellwenban/localhosts/www.factornine.co.uk/development/magic-squares-mobile/www" file (ENOTEMPTY, rmdir '/Users/russellwenban/localhosts/www.factornine.co.uk/development/magic-squares-mobile/www/fonts')..."



// cleans the distribution folder
gulp.task('clean', function(cb) {

    var build = args.build || args.emulate || args.run,

        targetDir = path.resolve(build ? './www' : './.tmp');

    console.log('clean: ', build, ' targetDir: ', targetDir);

    gulp.src(targetDir)
        .pipe(clean({force: true, read: false})).on('error', errorHandler);
    cb()
});

// Handle errors
function errorHandler(error) {
    console.log('Gulp Clean Error: ',error.toString());
    this.emit('end');
}