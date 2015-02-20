# Magic Squares Mobile

## Project Introduction

This project is a continuation of [Magic Squares](https://github.com/russellf9/magic-squares) focusing on creating the Magic Squares game for iOS using Ionic.

### Description

A logic puzzle where the objective is to solve a 3×3 magic square.

### Project Aims

The primary objective is to release an iOS app on iTunes.


### Keywords

logic, puzzle, maths, game

( The description and keywords are for [iTunes connect](itunesconnect.apple.com) )


### Icon


![Icon](/design/Icon-72@2x.jpg?raw=true "Magic Squares Icon")

### Screenshot

![Screenshot](/design/screenshot-640x1096.jpg?raw=true "Magic Squares Screenshot")


### Further objectives.

I've just submitted the app to Apple for verification. I'll list my new objectives here:

1. Incorporate Gulp more. ( For the ionic build etc )

2. Document the iOS submission process.

3. Use SASS. ( The CSS has become far too verbose for all the screen sixes etc. )

4. Make more use of [Flexbox](http://www.sketchingwithcss.com/samplechapter/cheatsheet.html).

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



### Ionic cmds

```
$ ionic platform add ios

$ ionic build ios

$ ionic emulate ios

$ ionic run ios

```

## Issues:

```
# ios-sim not present
 Library not loaded: @rpath/iPhoneSimulatorRemoteClient.framework/Versions/A/iPhoneSimulatorRemoteClient
```

See: [dyld: Library not loaded: #70](https://github.com/phonegap/ios-sim/issues/70)


```

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


# using Homebrew

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
