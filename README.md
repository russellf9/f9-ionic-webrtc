# Magic Squares Mobile

## Project Description

This project is a continuation of [Magic Squares](https://github.com/russellf9/magic-squares) focusing on creating the Magic Squares game for iOS using Ionic.

## Original Cordova Installation

(Update to Xcode 6 first!)

```
$ sudo npm install -g cordova ionic

$ ionic start magic-squares blank

$ cd magic-squares

# Develop in the browser with live reload:
ionic serve

```

Issues:

```
# ios-sim not present
 Library not loaded: @rpath/iPhoneSimulatorRemoteClient.framework/Versions/A/iPhoneSimulatorRemoteClient
```

See: [dyld: Library not loaded: #70](https://github.com/phonegap/ios-sim/issues/70)


```

\# using Homebrew

$ brew update

$ brew unlink ios-sim

$ brew install ios-sim
```

### Links

* [ios-sim](https://github.com/phonegap/ios-sim)
