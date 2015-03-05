angular.module('f9-webrtc')

    .controller('LoginCtrl', ['$scope', '$state', '$ionicPopup', 'signaling', 'ContactsService',
        function($scope, $state, $ionicPopup, signaling, ContactsService) {
            $scope.data = {};
            $scope.loading = false;

            $scope.login = function() {
                console.log('login!');
                $scope.loading = true;
                if (signaling) {
                    signaling.emit('login', $scope.data.name);
                } else {
                    var users = [];
                    console.log('login! | users: ', users);
                    ContactsService.setOnlineUsers(users, $scope.data.name);
                    $state.go('app.contacts');
                }
            };

            if (signaling) {
                signaling.on('login_error', function(message) {
                    $scope.loading = false;
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