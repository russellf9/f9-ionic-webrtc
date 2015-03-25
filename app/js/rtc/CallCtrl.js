'use strict';

angular.module('f9-webrtc')

    .controller('CallCtrl', ['$scope', '$state', '$rootScope', '$timeout', '$ionicModal', '$stateParams', '$document', 'CTIService', 'ContactsService', function($scope, $state, $rootScope, $timeout, $ionicModal, $stateParams, $document, CTIService, ContactsService) {

        $scope.callInProgress = false;

        $scope.contactName = $stateParams.contactName;

        // TODO
        $scope.isCalling = $stateParams.isCalling === 'true';

        // TODO
        $scope.muted = false;
        var _phoneRTC,
            _session;


        //  TODO
        //$scope.allContacts = ContactsService.onlineUsers;
        //$scope.contacts = {};
        //$scope.hideFromContactList = [$scope.contactName];

        //$ionicModal.fromTemplateUrl('partials/select_contact.html', {
        //    scope: $scope,
        //    animation: 'slide-in-up'
        //}).then(function(modal) {
        //    $scope.selectContactModal = modal;
        //});


        // answer a call if the user is the callee
        $scope.answer = function() {
            console.log('CallCtrl::answer | _phoneRTC: ', _phoneRTC);
            //CTIService.answer();
            if (_session) {
                console.log('session: ', _session);
                _session.call();
            }
        };

        // hang up the current call
        $scope.hangup = function() {
            CTIService.hangup();
        };

        // toggles the audio mute
        // TODO
        $scope.toggleMute = function() {

        };


        var addSession = function(data) {
            console.log('10:41 || A CallCtrl::addSession() | data: ', data);

            // add to the session?
            var session = CTIService.getSession();

            var isInitiator = (session.direction === 'outgoing');
            _phoneRTC = CTIService.getPhoneRTC(isInitiator);

            console.log('B CallCtrl::addSession() | session: ', session);
            console.log('C CallCtrl::addSession() | direction: ', session.direction);
            console.log('D CallCtrl::addSession() | phoneRTCSession: ', _phoneRTC);


            if (data.code === 0) {
            }

            if (session.direction === 'incoming') {
                _phoneRTC.Session(onSuccessIn, onFailure);
            }

            if (session.direction === 'outgoing') {
                _phoneRTC.createOffer(onSuccess, onFailure);
            }
        };

        // handlers for the jssip engine
        var onSuccessIn = function(session) {
            console.log('+++ In CallCtrl::Offer Success: ');

            _session = session;

            addEvents();
        };

        // handlers for the jssip engine
        var onSuccess = function(session) {
            console.log('CallCtrl::Offer Success: ');
            _session = session;
            addEvents();

            console.log('Session: ', session);

            console.log('Streams: ', session.streams); // {audio: true, video: true}

            session.call();

            console.log('_phoneRTC: ', _phoneRTC);

        };

        //
        var addEvents = function() {
            _session.on('sendMessage', function(data) {
                console.log('sendMessage: ', data);
            });
            _session.on('disconnect', function() {
                console.log('disconnect');
            });
            _session.on('answer', function() {
                console.log('Answered!');
            });
        };

        var onFailure = function(error) {
            console.log('CallCtrl::Offer failure: ', error);
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
                catch (error) {
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
                    addSession(data);
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
