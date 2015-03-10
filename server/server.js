var app = require('express')(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    console.log('a user connected');
    socket.on('chat message', function(msg) {
        console.log('message: ', msg);
        io.emit('chat message', msg)
    });
    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

http.listen(3000, function(){
    console.log('12:27|| I`m listening on *:3000');
});


