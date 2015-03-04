'use strict';

/**
 * The `serve` Gulp task has the responsibility of launching a local Chrome server to run the app.
 * Also,
 * @type {Gulp|exports}
 */

var gulp = require('gulp'),
    config = require('../../config'),
    path = require('path'),
    express = require('express'),
    open = require('open');

// serves the app
gulp.task('serve', function() {

    // We'll need a reference to the tinylr
    // object to send notifications of file changes
    var lr;

    // start the `Tiny LiveReload Server`
    function startLivereload() {
        lr = require('tiny-lr')();
        lr.listen(35729);
    }

    // Notifies livereload of changes detected by `gulp.watch()`
    function notifyLivereload(event) {
        // `gulp.watch()` events provide an absolute path
        // so we need to make it relative to the server root

        console.log('REFRESH!');

        var fileName = require('path').relative(_targetDir, event.path);

        lr.changed({
            body: {
                files: [fileName]
            }
        });
    }

    // define properties
    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        port = gulp.args.port || 9029,
        _targetDir = path.resolve(build ? 'www' : '.tmp'),

    // set up the express server
    app = express();
    app.use(require('connect-livereload')());
    app.use(express.static(_targetDir));
    app.listen(port);

    // can`t see how to handle the error!
    app.on('error', function(error) {
        console.log(error);
    });

    open('http://localhost:' + port + '/', 'Google Chrome');

    // live reload
    startLivereload();

    // have to do a watch here ( rather than in the `watchers` ) as
    // `serve` has reference to the 'tiny-lr' instance.
    gulp.watch(_targetDir + '/**')
        .on('change', function(event) {
            notifyLivereload(event);
        });
});


