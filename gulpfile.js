//see: http://stefanimhoff.de/2014/gulp-tutorial-1-intro-setup/
var requireDir = require('require-dir');

// Require all tasks in gulp/tasks, including subfolders
requireDir('./gulp/tasks', { recurse: true });