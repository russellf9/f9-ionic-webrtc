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


### Keywords

logic, puzzle, maths, game

( The description and keywords are for [iTunes connect](itunesconnect.apple.com) )


### Icon

![Icon](/design/Icon-72@2x.jpg?raw=true "Magic Squares Icon")

### Screenshot

![Screenshot](/design/magicSquaresiPad_small.png?raw=true "Magic Squares Mockup")


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


## Original Cordova Installation

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



### Ionic CLI cmds

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

I've done a quick test on the ipad and the app isn't fitting into the full width in portrait mode. Might be something to do wuth the width (vw) %

Perhaps using `vh` and 'vw` is problamatic see: [VH and VW units](https://gist.github.com/pburtchaell/e702f441ba9b3f76f587)


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
