# Magic Squares Mobile

Magic Squares Mobile is a Magic Squares Game developed using the [Ionicframework](http://ionicframework.com).

A continuation of my previous Github project [Magic Squares](https://github.com/russellf9/magic-squares).


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Magic Squares Mobile](#magic-squares-mobile)
  - [Project Introduction](#project-introduction)
    - [Description](#description)
    - [Project Objectives](#project-objectives)
    - [Technical Specifications.](#technical-specifications)
    - [Installation](#installation)
    - [Keywords](#keywords)
    - [Icon](#icon)
    - [Screenshot](#screenshot)
    - [Further objectives.](#further-objectives)
    - [Original Cordova Installation](#original-cordova-installation)
    - [Development](#development)
    - [Develop in the browser with live reload:](#develop-in-the-browser-with-live-reload)
    - [Gulp Commands](#gulp-commands)
    - [Ionic CLI Commands](#ionic-cli-commands)
    - [Issues:](#issues)
    - [SASS](#sass)
    - [iPad orientation](#ipad-orientation)
    - [using Homebrew](#using-homebrew)
    - [Node](#node)
      - [Update requirements](#update-requirements)
    - [Links](#links)
  - [TODO](#todo)
  - [Developed By](#developed-by)
  - [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Description

The 'Magic Squares Game' is a logic puzzle where the objective is to solve a 3×3 magic square.

To solve the puzzle the numbers in each row, and in each column, and the diagonals, all add up to the same number, this number is known as the 'magic number'.

## Project Objectives

The primary objective is to release a hybrid mobile app on iTunes.

Other objectives include learning new technical skills and creating a `seed` project for making further apps.

## Technical Specifications.

The app is written in HTML5, CSS3 and JavaScript.

More specifically I'm using the [Ionic Framework](http://ionicframework.com) which incorporates [Sass](http://sass-lang.com) and [AngularJS](http://angularjs.org/).

I've also focused on creating a series of modular Gulp tasks to speed up development.


## Installation

```
$ git clone git@github.com:russellf9/magic-squares-mobile.git

# update dependencies

```

## Icon

![Icon](/design/Icon-72@2x.jpg?raw=true "Magic Squares Icon")


## Screenshot

![Screenshot](/design/ipad-screenshot-150227.jpg?raw=true "Magic Squares Mockup")


## Development

I've begun making the app more modular but have encountered some issues:

1. The SASS task has been set up. I'll simply refactor the CSS files as SASS file. ( As the [sass-test](https://github.com/russellf9/sass-test) repo ).

2. I created two tasks for the JS files, _distribute_ and _scripts_. The _distribute_ tasks deploys the html files with the [gulp-useref](https://www.npmjs.com/package/gulp-useref), using `build-blocks`.

A method would have to be worked-out to establish the best way to deploy the files, as the Ionic task `ionic build ios` distributes the required files to the ios folder. It might be worthwhile to create a separate _app_ folder which deploys to the _www_ folder.

3. First-off, I'll just start using the new SASS files and leave the JS distribution issue to later.


## Gulp Commands

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


## Known Issues:

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




## TODO

[ ] Document the iOS submission process.



## Developed By

* Russell Wenban


## License

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