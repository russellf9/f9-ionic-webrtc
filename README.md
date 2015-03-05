# f9-ionic-webrtc


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

  - [Description](#description)
  - [Version](#version)
  - [Project Objectives](#project-objectives)
  - [Installation](#installation)
  - [Cordova](#cordova)
  - [The new build process](#the-new-build-process)
- [dev runs the 'dev' build and starts the server](#dev-runs-the-dev-build-and-starts-the-server)
- [build](#build)
- [or](#or)
- [emulate ios](#emulate-ios)
- [or](#or-1)
- [test on device](#test-on-device)
- [or](#or-2)
- [implements a semantic 'patch' increment](#implements-a-semantic-patch-increment)
- [implements semantic a 'minor' increment](#implements-semantic-a-minor-increment)
- [implements a semantic 'major' increment](#implements-a-semantic-major-increment)
- [creates a new git branch in the format 'dev-{YYMMDD}' from the current date](#creates-a-new-git-branch-in-the-format-dev-yymmdd-from-the-current-date)
  - [](#)
  - [ * Run npm install -g ionic to update](#-run-npm-install--g-ionic-to-update)
  - [    at require (module.js:384:17)](#at-require-modulejs38417)
  - [--](#--)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Description

A Ionic Test using WebRTC

## Version

The current version of the app is:

**0.0.9**



## Project Objectives


## Installation

```
$ git clone git@github.com:russellf9/f9-ionic-webrtc && cd f9-ionic-webrtc

# update node dependencies
$ npm update

# update bower dependencies
$ bower update

# to update node
node -v
v0.10.33

#  use n
npm install -g n

see: [Upgrade Node.js via NPM](http://davidwalsh.name/upgrade-nodejs)

# For the latest stable version:
sudo n stable

node -v
v0.12.0

```

## Cordova

```
# Not sure if I need this - the bower/node updates might be enough?
$ cordova platform add ios

```

## The new build process

Now attempting to use the _Browser Platform_

See: [Browser as a platform for your PhoneGap/Cordova apps](http://www.raymondcamden.com/2014/09/24/Browser-as-a-platform-for-your-PhoneGapCordova-apps)


```
# to add the Browser platform
# this builds from the current state of the www folder
$ cordova platform add browser --usegit


# to rebuild the www folder
$ gulp --build

# to run - kill Chrome, and then type
$ cordova run browser

# to run again
$ cordova run browser

# add platform
$ ionic platform ios

# rebuild
$ ionic build ios

# modify as per instructions

```


## Instructions for Xcode set up

Go platforms/ios and click on [ProjectName].xcodeproj to open it with XCode
Go to your project settings
In General, change Deployment Target to 7.0 or above
Go to Build Settings and change:

a. Valid Architectures => armv7

b. Build Active Architecture Only => No

c. Runpath Search Paths => $(inherited) @executable_path/Frameworks

d. Objective-C Bridging Header => [ProjectName]/Plugins/com.dooble.phonertc/Bridging-Header.h

e. Embedded content contains Swift Code => yes

Repeat steps 4a. - 4c. for the CordovaLib project

Make sure your build target is an actual iPhone or iPad running on the arm7 architecture. The iPhone and iPad simulators are not emulators, and only run on i386. The compiled RTC libraries for ios have been built for arm7.


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


**Note:** The widget.version in the config.xml needs to be updated as well.


# creates a new git branch in the format 'dev-{YYMMDD}' from the current date
$ gulp branch

```


## Known Issues:

On a fresh install of the app from Github I had the following error:

```
cordova platform add browser --usegit
Current working directory is not a Cordova-based project.
```

In the original project ( on my iMac ) there was a _Ionic.project_ file. This file was not committed.

I'm guessing that is the cause of the error!

Running:

```
ionic  platform add browser --usegit
Current working directory is not a Cordova-based project.

------------------------------------
Ionic CLI is out of date:
 * Locally installed version: 1.3.10
 * Latest version: 1.3.11
 * https://github.com/driftyco/ionic-cli/blob/master/CHANGELOG.md
 * Run npm install -g ionic to update
------------------------------------
```

I ran the following:

```

$ npm uninstall -g generator-karma && npm install -g generator-angular


$ sudo npm install -g ionic
```

So yo errors

```
peerinvalid The package yo does not satisfy its siblings' peerDependencies requirements!
npm ERR! peerinvalid Peer generator-angular@0.11.1 wants yo@>=1.0.0
npm ERR! peerinvalid Peer generator-angular-php@0.6.2 wants yo@~1.3.3
```

I ran
```
$ npm remove -g generator-angular
```

Actually the answer was pretty simple, I just added a www folder then:

```
$ cordova platform add browser --usegit
```
worked!


```
gulp --build
[16:58:14] Using gulpfile ~/localhosts/www.factornine.co.uk/development/f9-ionic-webrtc/gulpfile.js
[16:58:14] Starting 'build'...
[16:58:14] Starting 'clean'...
[16:58:14] Finished 'clean' after 144 ms
[16:58:14] Starting 'jshint'...
[16:58:14] 'jshint' errored after 117 ms
[16:58:14] Error: Cannot find module 'through2'
    at Function.Module._resolveFilename (module.js:336:15)
    at Function.Module._load (module.js:278:25)
    at Module.require (module.js:365:17)
    at require (module.js:384:17)
```

run

```
$ npm -v

2.5.1
``

Trying to update I had some interesting messages:

```
localhost:f9-ionic-webrtc factornine$ npm install gulp-jshint --save-dev
npm WARN package.json app@0.0.8 No repository field.
npm WARN package.json path@0.11.14 path is also the name of a node core module.
npm WARN locking Error: EACCES, open '/Users/factornine/.npm/_locks/gulp-jshint-e0a315277a01f285.lock'
npm WARN locking     at Error (native)
npm WARN locking  /Users/factornine/.npm/_locks/gulp-jshint-e0a315277a01f285.lock failed { [Error: EACCES, open '/Users/factornine/.npm/_locks/gulp-jshint-e0a315277a01f285.lock']
npm WARN locking   errno: -13,
npm WARN locking   code: 'EACCES',
npm WARN locking   path: '/Users/factornine/.npm/_locks/gulp-jshint-e0a315277a01f285.lock' }
npm ERR! Darwin 13.4.0
npm ERR! argv "/usr/local/bin/node" "/usr/local/bin/npm" "install" "gulp-jshint" "--save-dev"
npm ERR! node v0.12.0
npm ERR! npm  v2.5.1

npm ERR! Attempt to unlock /Users/factornine/localhosts/www.factornine.co.uk/development/f9-ionic-webrtc/node_modules/gulp-jshint, which hasn't been locked
npm ERR! 
npm ERR! If you need help, you may report this error at:
npm ERR!     <http://github.com/npm/npm/issues>
```
and

```
[17:16:51] Error: Cannot find module 'through2'
    at Function.Module._resolveFilename (module.js:336:15)
    at Function.Module._load (module.js:278:25)
    at Module.require (module.js:365:17)
    at require (module.js:384:17)
    at Object.<anonymous> (/Users/factornine/localhosts/www.factornine.co.uk/development/f9-ionic-webrtc/node_modules/gulp-notify/lib/extra_api.js:1:77)
    at Module._compile (module.js:460:26)
    at Object.Module._extensions..js (module.js:478:10)
    at Module.load (module.js:355:32)
    at Function.Module._load (module.js:310:12)
    at Module.require (module.js:365:17)
    at require (module.js:384:17)
--
---


Fixed the `lock` error by following advice from photusenigma at [Attempt to unlock, which hasn't been locked #4815](https://github.com/npm/npm/issues/4815)

```
sudo chown -R `whoami` ~/.npm
sudo chown -R `whoami` /usr/local/lib/node_modules

```

Update each plugin?

```
npm install --save-dev gulp-notify  node-notifier
```

```

17:39:17] 'styles' errored after 597 ms
[17:39:17] Error: Cannot find module 'node-notifier'
    at Function.Module._resolveFilename (module.js:336:15)
    at Function.Module._load (module.js:278:25)
    at Module.require (module.js:365:17)
    at require (module.js:384:17)
    at Object.<anonymous> (/Users/factor
    ... 
```
## TODO

1. [ ] Make a TODO list!.
1. [ ] Make the tree using `tree`

## Doctoc - Install

```
$ npm install -g doctoc
```


## Project Tree

```

```

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
