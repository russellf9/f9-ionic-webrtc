# Magic Squares Mobile

Magic Squares Mobile is a Magic Squares Game developed using the [Ionicframework](http://ionicframework.com).

A continuation of my previous Github project [Magic Squares](https://github.com/russellf9/magic-squares).


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Description](#description)
- [Icon](#icon)
- [Screenshot](#screenshot)
- [Project Objectives](#project-objectives)
- [Technical Specifications](#technical-specifications)
- [Installation](#installation)
- [Gulp Commands](#gulp-commands)
- [Known Issues:](#known-issues)
  - [SASS](#sass)
- [TODO](#todo)
- [Project Tree](#project-tree)
- [Developed By](#developed-by)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Description

The 'Magic Squares Game' is a logic puzzle where the objective is to solve a 3×3 magic square.

To solve the puzzle the numbers in each row, and in each column, and the diagonals, all add up to the same number, this number is known as the 'magic number'.


## Icon

![Icon](/design/Icon-72@2x.jpg?raw=true "Magic Squares Icon")


## Screenshot

![Screenshot](/design/screenshots/magicSquaresiPad_150227.jpg?raw=true "Magic Squares Mockup")



## Project Objectives

The primary objective is to release a hybrid mobile app on iTunes.

Other objectives include learning new technical skills and creating a _seed_ project for making further apps.


## Technical Specifications

The app is written in HTML5, CSS3 and JavaScript.

More specifically I'm using the [Ionic Framework](http://ionicframework.com) which incorporates [Sass](http://sass-lang.com) and [AngularJS](http://angularjs.org/).

I've also focused on creating a series of modular [Gulp](http://gulpjs.com) tasks to speed up development.


## Installation

```
$ git clone git@github.com:russellf9/magic-squares-mobile.git && cd magic-squares-mobile

# update node dependencies
$ npm update

# update bower dependencies
$ bower update

```


## Gulp Commands

I've spent considerable effort making the gulp tasks as modular as possible. Each task is within its own file and I'm using [require-dir](https://www.npmjs.com/package/require-dir) to keep the tasks DRY.

I've added a new set of commands based from [ionic-gulp-seed](https://github.com/tmaximini/ionic-gulp-seed).

In the original Ionic app, source files were located in the _www_ folder. I've separated the `dev` and `build` modes, so that the source files are within an _app_ folder. Gulp tasks have been set up to either test with a _.tmp_ location or distribute from the _www_ location.

**dev**
 * Runs from the .tmp folder
 * Files are not minified

```
# dev runs the 'dev' build and starts the server
$ gulp

```

**build**
 * Runs from the .www folder
 * Files are minified and concatenated.

```
# build
$ gulp --build
# or
$ gulp -b

```

**ionic CLI wrappers**

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

* [gulp-bump](https://www.npmjs.com/package/gulp-bump), increments the version numbers in the _package.json_ and _bower.json_.
Using **MAJOR.MINOR.PATCH**, [semantic versioning](http://semver.org).

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

1. [ ] Document the iOS submission process.
1. [ ] Improve the design.
1. [ ] Add different sets of numbers.
1. [ ] Add levels.
1. [ ] Add scores.
1. [ ] Add a timer.


## Project Tree

.
├── .bowerrc
├── .gitignore
├── .jscsrc
├── .jshintrc
├── LICENSE.txt
├── README.md
├── app
│   ├── css
│   │   ├── game.css
│   │   ├── ionic.app.css
│   │   ├── main.css
│   │   ├── scss
│   │   ├── style.css
│   │   └── style.css.map
│   ├── fonts
│   │   ├── fredokaone-regular-webfont.eot
│   │   ├── fredokaone-regular-webfont.svg
│   │   ├── fredokaone-regular-webfont.ttf
│   │   ├── fredokaone-regular-webfont.woff
│   │   └── fredokaone-regular-webfont.woff2
│   ├── img
│   │   └── icon.png
│   ├── index-copy.html
│   ├── index.html
│   ├── js
│   │   ├── app.js
│   │   ├── controllers.js
│   │   ├── game
│   │   │   ├── dragDrop.ctrl.js
│   │   │   ├── indicator.ctrl.js
│   │   │   ├── instructions.ctrl.js
│   │   │   ├── master.ctrl.js
│   │   │   ├── model.svc.js
│   │   │   └── text.svc.js
│   │   ├── lodash.svc.js
│   │   └── services.js
│   └── partials
│       └── game.html
├── bower.json
├── bower_components /
├── config.xml
├── design /
├── gulp
│   ├── config.js
│   └── tasks
│       ├── build
│       │   ├── build.js
│       │   ├── clean.js
│       │   ├── fonts.js
│       │   ├── images.js
│       │   ├── index.js
│       │   ├── ionic.js
│       │   ├── partials.js
│       │   ├── scripts.js
│       │   ├── styles.js
│       │   └── vendor.js
│       ├── default.js
│       ├── development
│       │   ├── serve.js
│       │   └── watchers.js
│       ├── standards
│       │   ├── jscs.js
│       │   └── jshint.js
│       └── utilities
│           ├── git.js
│           ├── noop.js
│           └── version.js
├── gulpfile.js
├── icons
│   └── ios
│       ├── icon-1024.png
│       ├── icon-40.png
│       ├── icon-40@2x.png
│       ├── icon-50.png
│       ├── icon-50@2x.png
│       ├── icon-60.png
│       ├── icon-60@2x.png
│       ├── icon-72.png
│       ├── icon-72@2x.png
│       ├── icon-76.png
│       ├── icon-76@2x.png
│       ├── icon-small.png
│       ├── icon-small@2x.png
│       ├── icon.png
│       └── icon@2x.png
├── package.json
├── scss
│   ├── _style.scss
│   ├── fonts
│   │   └── _fredoka.scss
│   ├── ionic.app.scss
│   └── partials
│       ├── _all.scss
│       ├── _base.scss
│       ├── _grid.scss
│       ├── _media.scss
│       ├── _typography.scss
│       └── _ui.scss
└── vendor.json


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