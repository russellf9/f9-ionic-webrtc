'use strict';

angular.module('f9-webrtc')
    .factory('ContactsService', ['_', function(_) {
        var onlineUsers = [],
            allUsers = ['pierre',
                'frank',
                'russell',
                'robert',
                'chaz'],
            currentUser = '';



        //SimpleCTI.$on('online', function(name) {
        //    if (onlineUsers.indexOf(name) === -1) {
        //        onlineUsers.push(name);
        //    }
        //});
        //
        //SimpleCTI.$on('offline', function(name) {
        //    var index = onlineUsers.indexOf(name);
        //    if (index !== -1) {
        //        onlineUsers.splice(index, 1);
        //    }
        //});


        return {
            onlineUsers: onlineUsers,
            setOnlineUsers: function(users, currentName) {
                console.log('users, currentName', users, currentName);
                currentUser = currentName;

                onlineUsers.length = 0;
                users.forEach(function(user) {
                    if (user !== currentName) {
                        onlineUsers.push(user);
                    }
                });
            },
            currentUser: function() {
                return currentUser;
            },
            validUser: function(name) {
                var index = allUsers.indexOf(name.toLowerCase());
                console.log(index);
                return index !== -1;
            }
        };
    }]);
