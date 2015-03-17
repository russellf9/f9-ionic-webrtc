'use strict';

angular.module('f9-webrtc')

    .controller('ContactsCtrl', ['$scope', '$timeout', 'ContactsService', function($scope, $timeout, ContactsService) {
        $scope.contacts = ContactsService.onlineUsers;


        $scope.title = ' `s Contacts';

        // watch the service for updates to the user status
        $scope.$watch(ContactsService.getUsers, function(newValue, oldValue, scope) {
            console.log('\n** !Contacts Updated ', newValue);
            $timeout(function() {
                $scope.currentUser = newValue.currentUser;

               // $scope.title = $scope.currentUser + ' `s Contacts';
            }, 20);
        });

    }]);