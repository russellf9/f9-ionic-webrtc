'use strict';


// add extensions:


/*

 Name	Extension	DDI
 Chaz	205
 Frank	202
 Pierre	201
 Robert	204
 Russell	203
 */

angular.module('f9-webrtc')
    .service('ContactsService', ['_', '$rootScope', function(_, $rootScope) {
        var onlineUsers = [],
            allUsers = ['pierre',
                'frank',
                'russell',
                'robert',
                'chaz'],
            phoneBook = [
                {name:'pierre',number:'201'},
                {name:'frank', number: '202'},
                {name:'russell', number: '203'},
                {name:'robert', number: '204'},
                {name:'chaz', number: '205'}],
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
                phoneBook.forEach(function(user) {
                    if (user.name !== currentName) {
                        onlineUsers.push(user);
                    }
                });


                data.onLineUsers = onlineUsers;
            },
            currentUser: function() {
                console.log('C  currentUser: ',  currentUser);
                return currentUser;
            },
            validUser: function(name) {
                var user = _.where(phoneBook, {name:name.toLowerCase()});
                return user.length  ? true : false;
            }
        };
    }]);
