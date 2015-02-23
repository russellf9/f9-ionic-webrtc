/**
    A task which distributes and creates scripts from `run blocks`
*/

var gulp        = require('gulp'),
    config      = require('../../config'),
    path        = require('path'),
    useref      = require('gulp-useref'),
    args = require('yargs')
        .alias('e', 'emulate')
        .alias('b', 'build')
        .alias('r', 'run')
        .default('build', false)
        .default('port', 9000)
        .argv;

gulp.task('distribute', function(cb) {

    var build = args.build || args.emulate || args.run;

    console.log('arg - build: ', build);

    var assets = useref.assets(),
        targetDir = path.resolve(build ? 'www' : '.tmp');

    return gulp.src(config.scripts.html)
        .pipe(assets)
        .pipe(assets.restore())
        .pipe(useref())
        .pipe(gulp.dest(targetDir));
    cb()
});