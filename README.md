# Magic Squares Mobile

## Project Introduction

This project is a continuation of my previous Github project [Magic Squares](https://github.com/russellf9/magic-squares).

### Description

The 'Magic Squares Game' is a logic puzzle where the objective is to solve a 3×3 magic square.

The magic square is _'... a square grid, where the numbers in each row, and in each column, and the numbers in the main and secondary diagonals, all add up to the same number...'_. This number is known as the 'magic number'. 

(_REF: [Magic square](http://en.wikipedia.org/wiki/Magic_square) - Wikipedia_)

### Project Objectives

The primary objective is to release a hybrid mobile app on iTunes.

Other objectives include learning new technical skills and creating a `seed` project for making further apps.

### Technical Specifications.

The app is written in HTML5, CS3 and JavaScript.

More specifically I'm using the [Ionic Framework](http://ionicframework.com) which incorporates [Sass](http://sass-lang.com) and [AngularJS](http://angularjs.org/).



Table of Contents

* Installation
* Usage
Configuration
Browser Support
How It Works
Obtaining OAuth Keys
API Reference
Contributing
* License


### Installation



### Keywords

logic, puzzle, maths, game

( The description and keywords are for [iTunes connect](itunesconnect.apple.com) )


### Icon

![Icon](/design/Icon-72@2x.jpg?raw=true "Magic Squares Icon")

### Screenshot

![Screenshot](/design/ipad-screenshot-150227.jpg?raw=true "Magic Squares Mockup")


### Further objectives.

I've just submitted the app to Apple for verification. I'll list my new objectives here:

1. Make the Gulp tasks modular.
    * The tasks are now completely modular
    * A few issues like the [template](https://github.com/sindresorhus/gulp-template) not working in scripts task needed to be ironed out.

2. Document the iOS submission process.

3. Use SASS. ( The CSS has become far too verbose for all the screen sixes etc. )
  * I've found using SASS to be a real joy. Making CSS more like programming and creating a much more semantic and concise code base.

4. Make more use of [Flexbox](http://www.sketchingwithcss.com/samplechapter/cheatsheet.html).
 * As the app will be targeted to modern browsers, Flexbox can be used for virtually all my positioning needs!
 * [gulp-autoprefixer](https://www.npmjs.com/package/gulp-autoprefixer) adds the vendor prefixes on prepossessing to keep the SCSS succinct and readable.

5. Improve the design.

6. Add different sets of numbers.

7. Add levels.

8. Add scores.

9. Add a timer.


### Original Cordova Installation

(Update to Xcode 6 first!)

```
$ sudo npm install -g cordova ionic

$ ionic start magic-squares blank

$ cd magic-squares

```


### Development

I've begun making the app more modular but have encountered some issues:

1. The SASS task has been set up. I'll simply refactor the CSS files as SASS file. ( As the [sass-test](https://github.com/russellf9/sass-test) repo ).

2. I created two tasks for the JS files, _distribute_ and _scripts_. The _distribute_ tasks deploys the html files with the [gulp-useref](https://www.npmjs.com/package/gulp-useref), using `build-blocks`.

A method would have to be worked-out to establish the best way to deploy the files, as the Ionic task `ionic build ios` distributes the required files to the ios folder. It might be worthwhile to create a separate _app_ folder which deploys to the _www_ folder.

3. First-off, I'll just start using the new SASS files and leave the JS distribution issue to later.


### Develop in the browser with live reload:

```
$ ionic serve
```

runs in:

[http://localhost:8100](http://localhost:8100/#/)

### Gulp Commands

I've spent considerable effort making the gulp tasks as modular as possible. Each task is within its own file and I'm using [require-dir](https://www.npmjs.com/package/require-dir) to keep the tasks DRY.

I've added a new set of commands based from [ionic-gulp-seed](https://github.com/tmaximini/ionic-gulp-seed).

In the original Ionic app, source files were located in the _www_ folder. I've separated the `dev` and `build` modes, so that the source files are within an _app_ folder. Gulp tasks have been set up to either test with a _.tmp_ location or distribute from the _www_ location.

**dev**
 * Runs from the .tmp folder
 * Files are not minified

**build**
 * Runs from the .www folder
 * Files are minified and concatenated.


```
# dev runs the 'dev' build and starts the server
$ gulp

```

```
# build
$ gulp --build
# or
$ gulp -b

```

**ionic**

```
# emulate ios
$ gulp -emulate
# or
$ gulp -e

```

```
# test on device
$ gulp -run
# or
$ gulp -r
```

**gulp utilities**

Also, I've added a couple of utilities.

[gulp-bump](https://www.npmjs.com/package/gulp-bump), which increments the version numbers in the _package.json_ and _bower.json_., using **MAJOR.MINOR.PATCH**, [semantic versioning](http://semver.org).

```
# implements a semantic 'patch' increment
$ gulp version-patch

# implements semantic a 'minor' increment
$ gulp version-minor

# implements a semantic 'major' increment
$ gulp version-major


# creates a new git branch in the format 'dev-{YYMMDD}' from the current date
$ gulp branch

```

### Ionic CLI Commands

```
$ ionic platform add ios

$ ionic build ios

$ ionic emulate ios

$ ionic run ios

```

### Issues:

```
# ios-sim not present
 Library not loaded: @rpath/iPhoneSimulatorRemoteClient.framework/Versions/A/iPhoneSimulatorRemoteClient
```

See: [dyld: Library not loaded: #70](https://github.com/phonegap/ios-sim/issues/70)


### SASS

In order to use the [gulp-ruby-sass](https://github.com/sindresorhus/gulp-ruby-sass) plugin the correct version of SASS has to be installed. ( > 3.4 ? )

```
sass -v
Sass 3.4.12 (Selective Steve)
```

To update SASS

```
gem update sass
```

Also, the correct syntax for the gulp sass task has to be implemented.

```
return rubySass(config.sass.rubySrc, { style: 'expanded' })
    .pipe(plumber())
    .pipe(autoprefixer(config.sass.autoprefixer))
    .pipe(gulp.dest(config.sass.rubyDest));
});

```

Relevant links:

[TypeError: Arguments to path.join must be strings #191](https://github.com/sindresorhus/gulp-ruby-sass/issues/191)
[How to update your Sass version](http://www.codechewing.com/library/update-sass-version/)

### iPad orientation

I've done a quick test on the ipad and the app isn't fitting into the full width in portrait mode. Might be something to do with the width (vw) %

Perhaps using `vh` and 'vw` is problematic see: [VH and VW units](https://gist.github.com/pburtchaell/e702f441ba9b3f76f587)


### using Homebrew

```
$ brew update

$ brew unlink ios-sim

$ brew install ios-sim
```


ios-deploy was not found.

```
$ npm install -g ios-deploy
```


### Node

#### Update requirements 

```
$ npm update
```

### Links

* [ios-sim](https://github.com/phonegap/ios-sim)

### TODO

-[ ]
-[ ]
-[ ]


### License

The MIT License (MIT)

Copyright (c) 2015 Russell Wenban - Factornine Ltd

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.