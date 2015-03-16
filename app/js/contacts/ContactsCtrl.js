'use strict';

angular.module('f9-webrtc')

    .controller('ContactsCtrl', ['$scope', '$timeout', 'ContactsService', function($scope, $timeout, ContactsService) {
        $scope.contacts = ContactsService.onlineUsers;

        // watch the service for updates to the user status
        $scope.$watch(ContactsService.getUsers, function(newValue, oldValue, scope) {
            console.log('\n** !Contacts Updated ', newValue);
            $timeout(function() {
                $scope.currentUser = newValue.currentUser;
            }, 20);
        });

    }]);