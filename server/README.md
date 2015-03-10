# Simple Node Server

## Description

This is the Simple Socket.io server from: [Get Started: Chat application](http://socket.io/get-started/chat/)

Available on Github: [rauchg/chat-example](https://github.com/rauchg/chat-example)


## Installation

Navigate to server location and install Node dependencies


```
$ cd ...localhosts/www.factornine.co.uk/development/ionic-webrtc/server

$ npm update

```


## Running the app

```
# Start the node server
$ node server.js
```

Open browser with:

http://localhost:3000/

If another console window is running the port something like the following error will be the result:

```
events.js:72
        throw er; // Unhandled 'error' event
              ^
Error: listen EADDRINUSE
    at errnoException (net.js:901:11)
    at Server._listen2 (net.js:1039:14)
    at listen (net.js:1061:10)
    at Server.listen (net.js:1135:5)
    at Object.<anonymous> (/Users/russellwenban/localhosts/www.factornine.co.uk/development/ionic-webrtc/server/server.js:19:6)
    at Module._compile (module.js:456:26)
    at Object.Module._extensions..js (module.js:474:10)
    at Module.load (module.js:356:32)
    at Function.Module._load (module.js:312:12)
    at Function.Module.runMain (module.js:497:10)
```


## Known issues

From the tutorial I had problems using the local socket.io library so I used the CDN version.

Loaded:
_node_modules/socket.io/lib/socket.js_

and

_node_modules/socket.io/node_modules/socket.io-client/socket.io.js_

without success.

It would be nice to use a local file rather than a CDN for mobile development.




