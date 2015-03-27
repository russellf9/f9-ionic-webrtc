'use strict';


// a service which handles the uesrs of the rtc app


angular.module('f9-webrtc')
    .service('ContactsService', ['_', '$rootScope', function(_, $rootScope) {
        var onlineUsers = [],
            phoneBook = [
                {name: 'pierre', number: '201'},
                {name: 'frank', number: '202'},
                {name: 'russell', number: '203'},
                {name: 'robert', number: '204'},
                {name: 'chaz', number: '205'}],
            currentUser = '',
            data = {};

        return {
            // simply returns the current users data
            getUsers: function() {
                return data;
            },
            onlineUsers: onlineUsers,
            // sets the online users
            // TODO redo this
            setOnlineUsers: function(users, currentName) {
                currentUser = currentName;
                data = {currentUser: currentName};

                //this works
                if ($rootScope.$root.$$phase != '$apply' && $rootScope.$root.$$phase != '$digest') {
                    $rootScope.$apply(function() {
                        data.currentUser = currentName;
                    });
                }
                onlineUsers.length = 0;
                phoneBook.forEach(function(user) {
                    if (user.name !== currentName) {
                        onlineUsers.push(user);
                    }
                });
                data.onLineUsers = onlineUsers;
            },
            // simply returns the complete phone book
            getPhoneBook: function() {
                return phoneBook;
            },
            getAllNumbers: function() {
                return _.pluck(phoneBook, 'number');
            },
            // simply returns the current user
            currentUser: function() {
                return currentUser;
            },
            // returns true if the supplied name is within the phone book
            validUser: function(name) {
                var user = _.where(phoneBook, {name: name.toLowerCase()});
                return user.length ? true : false;
            },
            //simply returns the name of the user with the supplied number
            getName: function(number) {
                var contacts = _.where(phoneBook, {'number': number});
                return contacts.length ? contacts[0].name : '';
            }
        };
    }]);

