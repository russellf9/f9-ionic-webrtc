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


        var _phoneRTC;

        var addHandlers = function(data) {
            console.log('10:41 || A CallCtrl::addHandlers() | data: ', data);

            // add to the session?
            var session = CTIService.getSession();

            var isInitiator = (session.direction === 'outgoing');
            _phoneRTC = CTIService.getPhoneRTC(isInitiator);

            console.log('B CallCtrl::addHandlers() | session: ', session);
            console.log('C CallCtrl::addHandlers() | direction: ', session.direction);
            console.log('D CallCtrl::addHandlers() | phoneRTCSession: ', _phoneRTC);


            // only add handlers if code is 0?
            if (data.code === 0) {

                //phoneRTCSession.on('sendMessage',  function (data) {
                //    console.log('sendMessage: ', data);
                //});
                //phoneRTCSession.on('disconnect', function () {
                //    console.log('disconnect');
                //});
                //phoneRTCSession.on('answer', function () {
                //    console.log('Answered!');
                //});
            }

            // if initiator
            //{status: true, code: 0, reason: "ring", number: "205", party: "caller"}
            if (data && data.party === 'caller') {
                //var offer = RTCEngine.createOffer(onSuccess, onFailure);
            }


            if (session.direction === 'incoming') {
                //session.answer();
                // session.createOffer(onSuccess, onFailure);
                //var obj = session.answer();
                //console.log('Answers with: ',obj);
            }

            if (session.direction === 'outgoing') {
                // session.createOffer(onSuccess, onFailure); not valid!
                //var _session = phoneRTCSession.createOffer(onSuccess, onFailure);


                // console.log('another session: ', _session);

                // failed to create the offer, but can we do something else?
                // phoneRTCSession.session.call(); // WON'T WORK
                // session.call(); // WON'T WORK
                // phoneRTCSession.call(); // WON'T WORK
                _phoneRTC.createOffer(onSuccess, onFailure);


            }
        };


        // handlers for the jssip engine
        var onSuccess = function(session) {
            console.log('CallCtrl::Offer Success: ', session);

            console.log('Session: ', session);

            console.log('Streams: ', session.streams); // {audio: true, video: true}

            session.call(); // failing

            session.on('sendMessage',  function (data) {
                console.log('sendMessage: ', data);
            });
            session.on('disconnect', function () {
                console.log('disconnect');
            });
            session.on('answer', function () {
                console.log('Answered!');
            });

            console.log('_phoneRTC: ', _phoneRTC);


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
                    addHandlers(data);
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
