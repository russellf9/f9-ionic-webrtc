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
            session,
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
            $scope.callInProgress = true;
            console.log('CallCtrl::answer | _phoneRTC: ', _phoneRTC);
            //CTIService.answer();
            if (_session) {
                console.log('session streams: ', _session.streams); // {audio: true, video: true}
                _session.call(); // -> PhoneRTCProxy::call()
                console.log('Are the 2 sessions the same?'); // no!
                console.log(_session == session);

                _phoneRTC.addStream(true, onMediaSuccess, onMediaFailure);
            }
        };

        // hang up the current call
        $scope.hangup = function() {
            CTIService.hangup();
            $scope.callInProgress = false;
        };

        // toggles the audio mute
        // TODO
        $scope.toggleMute = function() {

        };



        // Will be always be called by the update function on first launch
        // either the call is `outgoing` or it is `outgoing`
        // if the call is `outgoing` we create an Offer
        // if the call is `incoming` we create a Session
        var addSession = function(data) {
            console.log('10:41 || A CallCtrl::addSession() | data: ', data);

            // add to the session?
            session = CTIService.getSession();

            var isInitiator = (session.direction === 'outgoing');
            _phoneRTC = CTIService.getPhoneRTC(isInitiator);

            console.log('B CallCtrl::addSession() | session: ', session);
            console.log('C CallCtrl::addSession() | direction: ', session.direction);
            console.log('D CallCtrl::addSession() | phoneRTCSession: ', _phoneRTC);

            if (session.direction === 'outgoing') {
                _phoneRTC.createOffer(onSuccessOut, onFailure);
            }

            if (session.direction === 'incoming') {
                _phoneRTC.Session(onSuccessIn, onFailure);
            }


        };

        // handlers for the jssip engine
        // out
        var onSuccessOut = function(session) {
            console.log('PhoneRTC Offer Success: ');
            _session = session;
            addEvents();
            _session.call();
            _phoneRTC.addStream(true, onMediaSuccess, onMediaFailure);
        };
        // in
        var onSuccessIn = function(session) {
            console.log('PhoneRTC Session has been created');
            _session = session;
            addEvents();
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

        // handlers for the media stream
        // success
        var onMediaSuccess = function(value) {
            console.log('CallCtrl::onMediaSuccess: ',value);
        };
        // failure
        var onMediaFailure = function(value) {
            console.log('CallCtrl::onMediaFailure: ',value);
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




        // watch the service for updates to the login status
        $scope.$watch(CTIService.getCTIData, function(newValue, oldValue, scope) {
            console.log('CallCtrl -> getCTIData |  newValue: ', newValue);
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
