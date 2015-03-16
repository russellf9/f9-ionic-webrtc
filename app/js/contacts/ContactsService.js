'use strict';

angular.module('f9-webrtc')
    .service('ContactsService', ['_', '$rootScope', function(_, $rootScope) {
        var onlineUsers = [],
            allUsers = ['pierre',
                'frank',
                'russell',
                'robert',
                'chaz'],
            currentUser = '',
            data = {};


        return {
            // simply returns the current users data
            getUsers : function() {
                return data;
            },
            onlineUsers: onlineUsers,
            setOnlineUsers: function(users, currentName) {
                console.log('AAA users, currentName', users, currentName);
                currentUser = currentName;


                data = {currentUser:currentName};

                //this works
                if($rootScope.$root.$$phase != '$apply' && $rootScope.$root.$$phase != '$digest') {
                    $rootScope.$apply(function() {
                        data.currentUser = currentName;
                        console.log('BBB data!');
                    });
                }


                console.log('B  currentUser: ',  currentUser);

                onlineUsers.length = 0;
                users.forEach(function(user) {
                    if (user !== currentName) {
                        onlineUsers.push(user);
                    }
                });
            },
            currentUser: function() {
                console.log('C  currentUser: ',  currentUser);
                return currentUser;
            },
            validUser: function(name) {
                var index = allUsers.indexOf(name.toLowerCase());
                console.log(index);
                return index !== -1;
            }
        };
    }]);
