'use strict';

angular.module('f9-webrtc')

    .controller('LoginCtrl', ['$scope', '$state', '$ionicPopup', 'CTIService', 'ContactsService',
        function($scope, $state, $ionicPopup, CTIService, ContactsService) {
            $scope.data = {};
            $scope.loading = false;

            // failure {status: false, code: -1, reason: "Login failed"}
            $scope.status = {status: 0, code: -1, reason: ''};

            // login function
            $scope.login = function() {
                console.log('login - 14:27');
                $scope.loading = true;
                CTIService.login($scope.data.name);
            };

            // watch current page for updates and set page value
            // TODO try this syntax
            //$scope.$watch(function() {
            //    return CTIService.data;
            //}, function(data) {
            //    console.log('\n ++++ A data newValue: ',data + '\n\n');
            //    $scope.test = data;
            //}, true);


            var handleLoginStatusUpdates = function(data) {
                console.log('data: ', data);
                if(data.status) {
                    // success
                    $scope.loading = false;
                    $scope.error = false;
                    $scope.message = '';

                    // might be best if a service does this..
                    var user = $scope.data.name.toLowerCase();
                    ContactsService.setOnlineUsers([user], user);


                    $state.go('app.contacts');
                } else {
                    // failure
                    $scope.loading = false;
                    $scope.error = true;
                    $scope.message = data.reason;
                }

            };


            // watch the service for updates to the login status
            $scope.$watch(CTIService.getLoginData, function(newValue, oldValue, scope) {
                console.log(' D data newValue: ', newValue);
                if (newValue && newValue !== oldValue) {
                    $scope.status = newValue;
                    handleLoginStatusUpdates(newValue);
                }
            });

        }]);

