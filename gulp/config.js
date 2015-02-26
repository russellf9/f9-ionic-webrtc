var src = '/www';
var app = './app';
var build = 'build';
var development = 'build/development';
var production = 'build/production';
var srcAssets = 'app/_assets';
var developmentAssets = 'build/assets';
var productionAssets = 'build/production/assets';


var paths = {
    sass: ['./scss/**/*.scss']
};

var pkg = {
    version: '0.0.1'
};

module.exports = {
    pkg: {
        version: '0.0.1'
     },
    paths: {
        sass: './scss/**/*.{scss, sass}',
        fonts: './app/fonts/**',
        scripts:    app + '/js/**/*.js',
        vendor:     './vendor.json',
        partials: './app/partials/**/*.html',
        index:      app + '/index.html'
    },
    json: {
        package: './package.json',
        bower: './bower.json'
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
        src1: src + "/js/**/*/js",
        src: "./app/js/**/*.js",
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
        ' * Magic Squares Mobile, v+ ' + pkg.version + '\n' +
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

//  ' * Magic Squares Mobile, v<%= pkg.version %>\n' +