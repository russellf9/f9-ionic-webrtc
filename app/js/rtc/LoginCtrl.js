'use strict';

angular.module('f9-webrtc')

    .controller('LoginCtrl', ['$scope', '$state', '$ionicPopup', 'signaling', 'ContactsService',
        function($scope, $state, $ionicPopup, signaling, ContactsService) {
            $scope.data = {};
            $scope.loading = false;

            $scope.login = function() {
                console.log('login - 18:45');
                $scope.loading = true;
                if (signaling) {
                    signaling.emit('login', $scope.data.name);
                } else {
                    console.log('Error - no signalling');
                }
            };

            if (signaling) {
                signaling.on('login_error', function(message) {
                    $scope.loading = false;
                    console.log('Error - login_error');
                    var alertPopup = $ionicPopup.alert({
                        title: 'Error',
                        template: message
                    });
                });

                signaling.on('login_successful', function(users) {
                    ContactsService.setOnlineUsers(users, $scope.data.name);
                    $state.go('app.contacts');
                });
            }

        }]);