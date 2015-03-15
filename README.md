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
- [Instructions for Xcode set up](#instructions-for-xcode-set-up)
  - [Plugin issues](#plugin-issues)
- [Gulp Commands](#gulp-commands)
- [ipcortex - Keevio](#ipcortex---keevio)
- [Known Issues:](#known-issues)
- [](#)
- [ * Run npm install -g ionic to update](#-run-npm-install--g-ionic-to-update)
- [    at require (module.js:384:17)](#at-require-modulejs38417)
- [--](#--)
- [TODO](#todo)
  - [Utilities](#utilities)
  - [Doctoc](#doctoc)
    - [To Install](#to-install)
    - [To run](#to-run)
  - [Tree](#tree)
    - [To Install](#to-install-1)
    - [To run](#to-run-1)
- [Project Tree](#project-tree)
- [Developed By](#developed-by)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Description

A Ionic Test using WebRTC

## Version

The current version of the app is:

**0.1.1**


## Project Objectives

The motivation for the project is get a basic mobile app using Web Real-Time Communications (RTC).

I'm using the [phonertc](https://github.com/alongubkin/phonertc) cordova plugin


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

# For the latest stable version:
sudo n stable

node -v
v0.12.0

```

To update Node using **n** see: [Upgrade Node.js via NPM](http://davidwalsh.name/upgrade-nodejs)


## Cordova

```
# Not sure if I need this - the bower/node updates might be enough?
$ cordova platform add ios

```

## The new build process

We have three environments;

1. The local sever ( runs from the .tmp folder )
2. browser platform ( runs from platforms/browser ) - useful as cordova and the PhoneRTC are imported.
3. Deploys to an iOS device
(For this set up the emulator doesn't work)

Now attempting to use the _Browser Platform_

See: [Browser as a platform for your PhoneGap/Cordova apps](http://www.raymondcamden.com/2014/09/24/Browser-as-a-platform-for-your-PhoneGapCordova-apps)


```
# to add the Browser platform
# this builds from the current state of the www folder
$ cordova platform add browser --usegit

# add platform
$ ionic platform ios

# to rebuild the www folder
$ gulp --build

# to run - kill Chrome, and then type
$ cordova run browser

# to run again
$ cordova run browser

# rebuild ( same as gulp --build?)
$ ionic build ios

# to refresh the browser build
# 1. rebuild the www folder
$ gulp --build ( ensure the index task has been run )
# 2. `rebuild` the browser app
$ cordova run browser

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


I'm using Xcode rather than the Gulp or Ionic commands to deploy the app at the moment. (I'll document if that is the best technique in due course.)

### Plugin issues

I had an issue where the _.../Plugins/_ folder was empty after a build.

The post [Third Party Plugins Don’t Install Correctly (Fails on Build)](http://forum.ionicframework.com/t/third-party-plugins-dont-install-correctly-fails-on-build/7585) gave me a solution:

```
$ ionic platform rm ios
$ ionic platform add ios
```

This installed all the required plugins including the _Bridging-Header.h_ file which allowed the **Objective-C Bridging Header** to be set.



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
**Note:-**
I've made the _browserPlatform_ the default target for the serve task,
a little buggy for now, and the index and vendor files are not updated.
But this will be ok fir general development.


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

There seems to be a issue presently to test on device using Gulp only so use the following:*

```
# test on device
$ gulp --build
# "refresh" the build
# "cordova prepare" is now run by the build task, so there is no need to run
# from xcode select -> project -> device -> run ( the play like button )

```
* Error which perhaps refers to the arm64 and the armv7s architecture


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


## ipcortex - Keevio

Use the following URL:

https://pabx1.ipcortex.net/login.whtm

or

https://pabx1.ipcortex.net/keevio/


## Trello/Github integration

I'm attempting to ink commits up to Trello

See: [olebedev/hook-to-trello](https://github.com/olebedev/hook-to-trello)


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
_**Note:** without a **www** folder the project is not a valid cordova application.


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
```

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
```

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

### Utilities

I've used a few utilities to improve the documentation process.

### Doctoc

**Doctoc** creates a table of contents.

#### To Install

```
$ npm install -g doctoc
```

####  To run

```
doctoc README.md --github
```

### Tree

[Tree](http://mama.indstate.edu/users/ice/tree/) creates a tree diagram for a project.

#### To Install

Download from: [Download the latest version (tree-1.7.0.tgz) (FTP)](ftp://mama.indstate.edu/linux/tree/tree-1.7.0.tgz)


####  To run

```
# use the '-I' to ignore folders
$ tree -I '.temp|ionic.project|vendor|bower_components|hooks|node_modules|platforms|plugins|resources|server|www|modules|fonts'
```

The output can be copied into the README file.


## Project Tree


```
.
├── LICENSE.txt
├── README.md
├── app
│   ├── css
│   │   ├── ionic.app.css
│   │   └── style.css
│   ├── img
│   │   └── icon.png
│   ├── index.html
│   ├── js
│   │   ├── app.js
│   │   ├── contacts
│   │   │   ├── ContactsCtrl.js
│   │   │   └── ContactsService.js
│   │   ├── lodash
│   │   │   └── lodash.svc.js
│   │   └── rtc
│   │       ├── CallCtrl.js
│   │       ├── LoginCtrl.js
│   │       ├── VideoViewDirective.js
│   │       └── signaling.js
│   ├── partials
│   │   ├── app.html
│   │   ├── call.html
│   │   ├── contacts.html
│   │   ├── login.html
│   │   ├── select_contact.html
│   │   └── view-1.html
│   └── tree
├── bower.json
├── config.xml
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
│       ├── socket
│       ├── standards
│       │   ├── jscs.js
│       │   └── jshint.js
│       └── utilities
│           ├── git.js
│           ├── noop.js
│           └── version.js
├── gulpfile.js
├── icons
├── package.json
├── scss
│   ├── _style.scss
│   ├── ionic.app.scss
│   └── partials
│       ├── _all.scss
│       ├── _base.scss
│       ├── _grid.scss
│       ├── _media.scss
│       ├── _typography.scss
│       └── _ui.scss
├── tree
└── vendor.json
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
