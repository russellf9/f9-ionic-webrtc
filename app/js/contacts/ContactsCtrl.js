'use strict';

// the controller for the contacts, the default `start` page for the app
angular.module('f9-webrtc')

    .controller('ContactsCtrl', ['$scope', '$timeout', '$state', 'ContactsService', 'CTIService',
        function($scope, $timeout, $state, ContactsService, CTIService) {
            $scope.contacts = ContactsService.onlineUsers;

            // call the supplied contact
            $scope.call = function(contact) {
                CTIService.dial(contact);
            };

            // logout of the app
            // NOTE:- For the time is cheating, only going back to the login page
            $scope.logout = function() {
                $state.go('app.login');
            };

            // watch the service for updates to the user status
            // will return the currentUser and the onLineUsers ( all the users less the current user )
            $scope.$watch(ContactsService.getUsers, function(newValue, oldValue, scope) {
                console.log('\n** !Contacts Updated ', newValue);
                $timeout(function() {
                    $scope.currentUser = newValue.currentUser;
                }, 20);
            });

            // watch the service for updates to the login status
            $scope.$watch(CTIService.getCTIData, function(newValue, oldValue, scope) {
                console.log('ContactsCtrl::update', newValue);
                if (newValue && newValue !== oldValue) {
                    handleUpdate(newValue);
                }
            });

            // the handler for status updates
            var handleUpdate = function(data) {
                console.log('ContactsCtrl::handleUpdate: ', data);
                var name = '';
                if (data.status) {
                    if (data.code === 0) {
                        // if ringing go to call
                        if(data.reason === 'ring') {
                            name = ContactsService.getName(data.number);
                            $state.go('app.call', {contactName: name});
                        }
                    } else if (data.code === 1) {
                        // we have the number so we can look up the name of the caller
                        name = ContactsService.getName(data.number);
                        console.log('ContactsCtrl::handleUpdate | name: ', name);
                        // if the code is 1 we have a new call!
                        $state.go('app.call', {contactName: name});
                    }
                }
            };
        }]);

