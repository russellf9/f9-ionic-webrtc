'use strict';

angular.module('f9-webrtc')

    .controller('CallCtrl', ['$scope', '$state', '$rootScope', '$timeout', '$ionicModal', '$stateParams', '$document', 'CTIService', 'ContactsService', function($scope, $state, $rootScope, $timeout, $ionicModal, $stateParams, $document, CTIService, ContactsService) {
        //var duplicateMessages = [];
        //
        $scope.callInProgress = false;
        //
        //$scope.isCalling = $stateParams.isCalling === 'true';
        $scope.contactName = $stateParams.contactName;
        //
        //$scope.allContacts = ContactsService.onlineUsers;
        //$scope.contacts = {};
        //$scope.hideFromContactList = [$scope.contactName];
        //$scope.muted = false;

        //$ionicModal.fromTemplateUrl('partials/select_contact.html', {
        //    scope: $scope,
        //    animation: 'slide-in-up'
        //}).then(function(modal) {
        //    $scope.selectContactModal = modal;
        //});

        console.log('A 21::38 CallCtrl | $stateParams: ', $stateParams.contactName);


        $scope.data = ContactsService.getLoginData;

        // answer a call if the user is the callee
        $scope.answer = function() {
            console.log('CallCtrl::answer');
            CTIService.answer();
        };

        // hang up the current call
        $scope.ignore = function() {
            CTIService.hangup();
        };

        $timeout(function() {
            $scope.currentSession = CTIService.getSession();

            console.log('B CallCtrl::11:08 session: ', $scope.currentSession);

            if ($scope.currentSession) {
                var stream = $scope.currentSession.getRemoteStreams()[0];
                attachMediaStream($document[0].getElementById('audio'), stream);
            }

        }, 100);


        // attaches the stream as audio
        var attachStream = function() {
            $scope.currentSession = CTIService.getSession();
            console.log('B CallCtrl::attachStream session: ', $scope.currentSession);
            if ($scope.currentSession) {
                var stream = $scope.currentSession.getRemoteStreams()[0];
                attachMediaStream($document[0].getElementById('audio'), stream);
            }
        };

        // watch the service for updates to the login status
        $scope.$watch(CTIService.getLoginData, function(newValue, oldValue, scope) {
            console.log('CallCtrl -> getLoginData |  newValue: ', newValue);
            $scope.status = newValue;
            handleLoginStatusUpdates(newValue);
        });

        // the handler for status updates
        var handleLoginStatusUpdates = function(data) {
            console.log('CallCtrl::data: ', data);
            if (data.status) {
                // call active
                $scope.party = data.party;
                // if the call is being made
                if (data.code === 0) {
                    attachStream();
                }

            } else {
                // call inactive
                if (data.code === -1) {
                    // call has been hung-up
                    $state.go('app.contacts');
                }
            }

        };

    }]);
