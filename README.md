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


![Icon](/magic-squares/design/Icon-72@2x.jpg?raw=true "Magic Squares Icon")

### Screenshot

![Screenshot](/magic-squares/design/screenshot-640x1096.jpg?raw=true "Magic Squares Screenshot")


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

### Develop in the browser with live reload:

```
$ ionic serve
```

- issue with cmd. Will re-visit with Gulp.



### Ionic cmds

```
$ ionic build ios

$ ionic emulate ios

```

## Issues:

```
# ios-sim not present
 Library not loaded: @rpath/iPhoneSimulatorRemoteClient.framework/Versions/A/iPhoneSimulatorRemoteClient
```

See: [dyld: Library not loaded: #70](https://github.com/phonegap/ios-sim/issues/70)


```

# using Homebrew

$ brew update

$ brew unlink ios-sim

$ brew install ios-sim
```


ios-deploy was not found.

```
$ npm install -g ios-deploy
```

### Links

* [ios-sim](https://github.com/phonegap/ios-sim)
