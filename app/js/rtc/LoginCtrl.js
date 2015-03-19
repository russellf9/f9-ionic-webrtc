'use strict';

// the controller for app's login functionality
angular.module('f9-webrtc')
    .controller('LoginCtrl', ['$scope', '$state', '$ionicPopup', 'CTIService', 'ContactsService',
        function($scope, $state, $ionicPopup, CTIService, ContactsService) {
            $scope.data = {};
            $scope.loading = false;

            // the default status
            // TODO needs a rename?
            $scope.status = {status: 0, code: -1, reason: ''};

            // login function
            $scope.login = function() {
                $scope.loading = true;
                CTIService.login($scope.data.name);
            };

            // logout of the app
            // NOTE:- For the time is cheating, only going back to the login page
            $scope.logout = function() {
                $scope.loading = false;
                $scope.error = false;
                $scope.message = '';
                $state.go('app.login');
            };

            // watch the service for updates to the login status
            $scope.$watch(CTIService.getCTIData, function(newValue, oldValue, scope) {
                if (newValue && newValue !== oldValue) {
                    $scope.status = newValue;
                    handleLoginStatusUpdates(newValue);
                }
            });

            // the handler for the status update
            var handleLoginStatusUpdates = function(data) {
                console.log('data: ', data);
                if(data.status) {
                    // success
                    $scope.loading = false;
                    $scope.error = false;
                    $scope.message = '';

                    // TODO might be best if a service does this..
                    var user = $scope.data.name.toLowerCase();
                    ContactsService.setOnlineUsers([user], user);

                    // login success
                    $state.go('app.contacts');
                } else {
                    // failure
                    $scope.loading = false;
                    $scope.error = true;
                    $scope.message = data.reason;
                }
            };
        }]);


