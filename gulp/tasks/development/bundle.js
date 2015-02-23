var gulp = require('gulp'),
    config = require('../../config');



/* list to add --
 [
 'scripts',
 'scripts-ng',
 'vendor',
 'version',
 ],
 See: https://github.com/driftyco/ionic/blob/master/gulpfile.js
 */
gulp.task('bundle', ['distribute', 'move-fonts'], function() {
    console.log('bundle - doing!!')
});