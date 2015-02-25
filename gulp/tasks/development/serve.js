var gulp = require('gulp'),
    config = require('../../config'),
    path = require('path'),
    express = require('express'),
    open = require('open');

// start local server
/* NOTE: if a console window is already running the `serve` will get error:

    error events.js:72
    throw er; // Unhandled 'error' event
           ^
    Error: listen EADDRINUSE

    ---
*/
gulp.task('serve', function() {

    var build = gulp.args.build || gulp.args.emulate || gulp.args.run,
        port = gulp.args.port || 9029,
        targetDir = path.resolve(build ? 'www' : '.tmp');

    var app = express();
    app.use(express.static(targetDir));
    app.listen(port);

    open('http://localhost:' + port + '/', 'Google Chrome');


    // cant see how to handle the error!
    app.on('error', function(error) {
        console.log(error)
    });

});
