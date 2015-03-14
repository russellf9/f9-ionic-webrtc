'use strict';

var src = '/www',
    app = './app',
    browserPlatform = './platforms/browser/www',
    tmp = '.tmp',
    version = '0.1.6';


module.exports = {
    pkg: {
        version: '0.1.6'
    },
    paths: {
        sass: './scss/**/*.{scss, sass}',
        fonts: app + '/fonts/**',
        appJs: app + '/js/app.js',
        ctiJs: app + '/js/cti/simpleCTI.js',
        scripts: app + '/js/**/*.js',
        vendor: './vendor.json',
        partials: app + '/partials/**/*.html',
        index: app + '/index.html',
        images: app + '/img/**/*.*',
        // we can switch between `.tmp` or `browser` here
        target: browserPlatform
    },
    json: {
        package: './package.json',
        bower: './bower.json',
        config: './gulp/config.js'
    },
    sass: {
        IS_WATCH: false,
        src: './scss/**/*.{scss, sass}',
        rubySrc: './scss/',
        rubyDest: './app/css/',
        dest: './app/css/ionic.css',
        options: {
            noCache: true,
            compass: false
            //,
            //bundleExec: false,
            //sourcemap: true,
            // sourcemapPath: '../../scss',
            //sourcemapPath: '.'
            //// sourcemapPath: './scss/scss',
            // sourcemapPath: '../scss'
        },
        autoprefixer: {
            browsers: [
                'last 2 versions',
                'safari 5',
                'ie 8',
                'ie 9',
                'opera 12.1',
                'ios 6',
                'android 4'
            ],
            cascade: true
        }
    },
    scripts: {
        src1: src + '/js/**/*/js',
        src: './app/js/**/*.js',
        testSrc: './.tmp/scripts/**/*.js',
        html: './app/**/*.html',
        dist: '.tmp',
        name: 'app.js',
        IS_RELEASE_BUILD: true
    },
    build: {
        banner: '/*!\n' +
        ' * Copyright 2015 Factornine Ltd.\n' +
        ' * http://www.factornine.co.uk/\n' +
        ' *\n' +
        ' * Magic Squares Mobile, v+  <%= pkg.version %> \n' +
        ' * A HTML5 Angular mobile game.\n' +
        ' *\n' +
        ' * By @russellf9 \n' +
        ' *\n' +
        ' * Licensed under the MIT license. Please see LICENSE for more information.\n' +
        ' *\n' +
        ' */\n\n',
        closureStart: '(function() {\n',
        closureEnd: '\n})();',
        dist: './dist',
        html: src + '/index-copy.html'
    }
};

