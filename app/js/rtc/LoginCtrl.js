'use strict';

angular.module('f9-webrtc')

    .controller('LoginCtrl', ['$scope', '$state', '$ionicPopup', 'CTIService', 'ContactsService',
        function($scope, $state, $ionicPopup, CTIService, ContactsService) {
            $scope.data = {};
            $scope.loading = false;

            $scope.login = function() {
                console.log('login - 18:45');
                $scope.loading = true;
                if (CTIService.login($scope.data.name)) {

                } else {
                    console.log('Can`t login!');
                    $scope.loading = false;
                }
            };

        }]);