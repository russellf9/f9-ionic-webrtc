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
                _session.call(); // -> PhoneRTCProxy::call()
                console.log('Are the 2 sessions the same?'); // no!
                console.log(_session == session);
                // not sure if there is any point to this...
                _phoneRTC.addStream(true, onMediaSuccess, onMediaFailure);
               attachStream();
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
        var addPhoneRTC = function(data) {
            console.log('10:41 || A CallCtrl::addPhoneRTC() | data: ', data);

            // add to the session?
            session = CTIService.getSession();

            var isInitiator = (session.direction === 'outgoing');
            _phoneRTC = CTIService.getPhoneRTC(isInitiator);

            console.log('B CallCtrl::addPhoneRTC() | session: ', session);
            console.log('C CallCtrl::addPhoneRTC() | direction: ', session.direction);
            console.log('D CallCtrl::addPhoneRTC() | phoneRTCSession: ', _phoneRTC);

            if (session.direction === 'outgoing') {
                _phoneRTC.createOffer(onSuccessOut, onFailure);
            }

            if (session.direction === 'incoming') {
                _phoneRTC.Session(onSuccessIn, onFailure);
            }

            attachStream();
        };

        // handlers for the jssip engine
        // out
        // @param session -
        var onSuccessOut = function(session) {
            console.log('PhoneRTC Offer Success: ', session);
            _session = session;
            addEvents();
            _session.call();
            _phoneRTC.addStream(true, onMediaSuccess, onMediaFailure);
        };
        // in
        var onSuccessIn = function(session) {
            console.log('PhoneRTC Session has been created: ', session);
            _session = session;
            addEvents();
        };


        // attaches the stream as audio
        var attachStream = function() {
            console.log('A CallCtrl::attachStream | streams: ', CTIService.getStreams());
            if ($scope.currentSession) {
                try {
                    var streams = CTIService.getStreams();
                    attachMediaStream($document[0].getElementById('audio'), streams[0]);
                }
                catch (error) {
                    console.log('CallCtrl::attachStream -> Error', error);
                }
            }
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

            // test

            console.log('CallCtrl::addEvents::addEvents | ', _phoneRTC.session);
            _phoneRTC.session.on('A sendMessage', function(data) {
                console.log('CallCtrl::Message::sendMessage: ', data);
            });

            _session.on('B sendMessage', function(data) {
                console.log('CallCtrl::Message::sendMessage: ', data);
            });
            _session.on('C disconnect', function() {
                console.log('CallCtrl::Message::disconnect');
            });
            _session.on('D answer', function() {
                console.log('CallCtrl::Message::Answered!');
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
                    addPhoneRTC(data);
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
