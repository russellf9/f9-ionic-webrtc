var gulp = require('gulp');
var gutil = require('gulp-util');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs'),
    git = require('gulp-git');

var paths = {
  sass: ['./scss/**/*.scss']
};

gulp.task('default', ['sass']);

gulp.task('sass', function(done) {
    //console.log('AASS!');
    //return;
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

// Create a new git branch
// Uses the default name as: dev-{YYMMDD}
gulp.task('branch', function() {
    var today = new Date(),
        month = String((today.getMonth() + 1 >= 10) ? (today.getMonth() + 1) : ('0' + String(today.getMonth() + 1))),
        date = String((today.getDate() >= 10) ? (today.getDate()) : ('0' + (today.getDate()))),
        year = String(today.getFullYear()),
        shortYear = year.substr(year.length - 2, 2),
        dateString = shortYear + month + date,
        branchName = 'dev-' + dateString;

    git.checkout(branchName, {args: '-b'}, function(err) {
        if (err) {
            throw err;
        } else {
            console.log('Git branch - ', branchName, ' created.');
        }
    });
});


gulp.task('test', function() {
    console.log('test!');
});
