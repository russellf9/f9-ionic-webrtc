angular.module('f9-webrtc')
    .factory('signaling', ['socketFactory', function(socketFactory) {

        if (typeof io === 'undefined') {
            console.log('io doesn`t exist!');
            return null;
        }

        var socket = io.connect('http://192.168.1.100:3000/');

        var socketFactory = socketFactory({
            ioSocket: socket
        });

        return socketFactory;

    }]);