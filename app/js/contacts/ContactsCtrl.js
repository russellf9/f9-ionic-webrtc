'use strict';

angular.module('f9-webrtc')

    .controller('ContactsCtrl', ['$scope', '$timeout', '$state', 'ContactsService', 'CTIService',
        function($scope, $timeout, $state, ContactsService, CTIService) {
        $scope.contacts = ContactsService.onlineUsers;

        // watch the service for updates to the user status
        $scope.$watch(ContactsService.getUsers, function(newValue, oldValue, scope) {
            console.log('\n** !Contacts Updated ', newValue);
            $timeout(function() {
                $scope.currentUser = newValue.currentUser;
            }, 20);
        });

        // call the supplied contact
        $scope.call = function(contact) {
            console.log('12:07 || call! - ', contact);
            CTIService.dial(contact);
        };

        //logout of the app
        // NOTE:- For the time is cheating, only going back to the login page
        $scope.logout = function() {
            $state.go('app.login');
        };

    }]);
