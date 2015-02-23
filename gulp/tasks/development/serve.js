var gulp = require('gulp'),
    config = require('../../config'),
    express = require('express'),
    path = require('path'),
    connectLr = require('connect-livereload'),
    open = require('open'),
    connect = require('gulp-connect');

// NOTE - HAVE TO BUILD FIRST!

// start local express server
gulp.task('serve', function() {

    var build = false,
        port = 9000,

        targetDir = path.resolve(build ? 'www' : '.tmp');

    connect.server({
        root: targetDir,
        livereload: true
    });

    //express()
    //    .use(!build ? connectLr() : function(){})
    //    .use(express.static(targetDir))
    //    .listen(port);
    //open('http://localhost:' + port + '/', 'Google Chrome');
});