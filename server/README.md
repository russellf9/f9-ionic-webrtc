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



## Known issues

From the tutorial I had problems using the local socket.io library so I used the CDN version.

Loaded:
_node_modules/socket.io/lib/socket.js_

and

_node_modules/socket.io/node_modules/socket.io-client/socket.io.js_

without success.

It would be nice to use a local file rather than a CDN for mobile development.




