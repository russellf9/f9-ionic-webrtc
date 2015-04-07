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
            console.log('17:36 A CallCtrl::answer | _phoneRTC: ', _phoneRTC);
            if (_session) {
                console.log('session: ', _session);


                testSession();
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

        // will always be called
        // {status: true, code: 0, reason: "ring", number: "205", party: null}
        // {status: true, code: 0, reason: "ring", number: "205", party: "callee"}
        // @param data the object constructed by the event callback
        var addSession = function(data) {
            // do I need to wait for the confirmed call back?

            console.log('\n14:43 || A CallCtrl::addSession() | data: ', data);

            // add to the session?
            var session = CTIService.getSession();

            console.log('\n14:43 || B CallCtrl::addSession() | session: ', session.id);

            var stream = CTIService.getStream();

            console.log('\n14:43 || C CallCtrl::addSession() | stream: ', stream);
            //return;

            var isInitiator = (session.direction === 'outgoing');
            _phoneRTC = CTIService.getPhoneRTC(isInitiator);

            //console.log('B CallCtrl::addSession() | session: ', session);
            //console.log('C CallCtrl::addSession() | direction: ', session.direction);
            //console.log('D CallCtrl::addSession() | phoneRTC: ', _phoneRTC);


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
        // for callee
        var onSuccessIn = function(session) {
            console.log('\n++++++++++');
            console.log(' In CallCtrl::Offer Success: ');

            _session = session;

            _phoneRTC.sendMessage({type: 'offer', sdp: {audio: true, video: true}});

            addEvents();

            $timeout(testSession, 1000);


        };

        // for caller
        var onSuccess = function(session) {
            console.log('\n++++++++++');
            console.log('CallCtrl::Offer Success: ');
            _session = session;
            addEvents();
            // console.log('Streams: ', session.streams); // just {audio: true, video: true}
            //console.log('CallCtrl::Offer Success', session);

            _session.call(); // necessary to fire the JsSIPCordovaRTCEngine `sendMessage` event

            // _phoneRTC.call();  // this call as well, for the `internal` call function
            // will also cause an error in l
            // `video - updatePosition`

            // but how do we add the stream to the peer connection?

            testSession();


        };

        var testSession = function() {
            _phoneRTC.addStream(true, onMediaSuccess, onMediaFailure);


            // test the various connections

            var jsSip = CTIService.getJsSip();

            console.log('~~~~ TESTING: jsSip: ', jsSip);
            console.log('~~~~ TESTING: jsSip connected: ', jsSip.isConnected());
            console.log('~~~~ TESTING: jsSip registered: ', jsSip.isRegistered());
            console.log('~~~~ TESTING: JsSIPCordova/_phoneRTC is Ready: ', _phoneRTC.isReady());
            console.log('~~~~ TESTING: JsSIPCordova/_phoneRTC remote description: ', _phoneRTC.getRemoteDescription());


            //attachStream();
            $timeout($scope.updateVideoPosition, 1000);
        };

        // handlers for the media stream
        // success
        var onMediaSuccess = function() {
            console.log('CallCtrl::onMediaSuccess');
        };
        // failure
        var onMediaFailure = function() {
            console.log('CallCtrl::onMediaFailure');
        };

        //
        var addEvents = function() {
            _session.on('sendMessage', function(data) {
                console.log('sendMessage: ', data);

                if (data.type === 'candidate') {
                    console.log('sendMessage | candidate: ', data.candidate);
                    console.log('~~~~ TESTING: JsSIPCordova/_phoneRTC is Ready: ', _phoneRTC.isReady());
                }
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
                    //var stream = $scope.currentSession.getRemoteStreams()[0];
                    var streams = $scope.currentSession.get('remoteStreams');
                    attachMediaStream($document[0].getElementById('audio'), streams);
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
