'use strict';

angular.module('f9-webrtc')

    .controller('CallCtrl', ['$scope', '$state', '$rootScope', '$timeout', '$ionicModal', '$stateParams', '$document', 'CTIService', 'ContactsService', function($scope, $state, $rootScope, $timeout, $ionicModal, $stateParams, $document, CTIService, ContactsService) {

        $scope.callInProgress = false;

        $scope.contactName = $stateParams.contactName;

        // TODO
        $scope.isCalling = $stateParams.isCalling === 'true';

        // TODO
        $scope.muted = false;


        // Contacts TODO
        //$scope.allContacts = ContactsService.onlineUsers;
        //$scope.contacts = {};
        //$scope.hideFromContactList = [$scope.contactName];

        //$ionicModal.fromTemplateUrl('partials/select_contact.html', {
        //    scope: $scope,
        //    animation: 'slide-in-up'
        //}).then(function(modal) {
        //    $scope.selectContactModal = modal;
        //});

        //console.log('CallCtrl | $stateParams: ', $stateParams.contactName);


        // answer a call if the user is the callee
        $scope.answer = function() {
            console.log('CallCtrl::answer');
            CTIService.answer();
        };

        // hang up the current call
        $scope.hangup = function() {
            CTIService.hangup();
        };

        // toggles the audio mute
        // TODO
        $scope.toggleMute = function() {

        };

        // attaches the stream as audio
        var attachStream = function() {
            $scope.currentSession = CTIService.getSession();

            console.log('A CallCtrl::attachStream | session: ', $scope.currentSession);
            if ($scope.currentSession) {

                try {
                    var stream = $scope.currentSession.getRemoteStreams()[0];
                    attachMediaStream($document[0].getElementById('audio'), stream);
                }
                catch(error) {
                    console.log('CallCtrl::attachStream -> Error', error);
                }
            }
        };

        // watch the service for updates to the login status
        $scope.$watch(CTIService.getCTIData, function(newValue, oldValue, scope) {
            //console.log('CallCtrl -> getCTIData |  newValue: ', newValue);
            $scope.status = newValue;
            handleUpdate(newValue);
        });

        // the handler for status updates
        var handleUpdate = function(data) {
            if (data.code === 1) {
                $scope.callInProgress = true;
            }
            if (data.status) {
                // call active
                $scope.party = data.party;
                // if the call is being made
                if (data.code === 0 || data.code === 1) {
                    attachStream();
                }
            } else {
                // call inactive
                if (data.code === -1) {
                    // call has been hung-up, so back to the contacts
                    $state.go('app.contacts');
                    $scope.callInProgress = false;
                }
            }
        };
    }]);
