'use strict';

angular.module('f9-webrtc')

    .controller('CallCtrl', ['$scope', '$state', '$rootScope', '$timeout', '$ionicModal', '$stateParams', '$document', 'CTIService', 'ContactsService', function($scope, $state, $rootScope, $timeout, $ionicModal, $stateParams, $document, CTIService, ContactsService) {
        //var duplicateMessages = [];
        //
        //$scope.callInProgress = false;
        //
        //$scope.isCalling = $stateParams.isCalling === 'true';
        //$scope.contactName = $stateParams.contactName;
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

        console.log('12::08 CallCtrl');


        $timeout(function() {
            $scope.currentSession = CTIService.getSession();

            console.log('A CallCtrl::17:02 session: ', $scope.currentSession);



            // for some reason had to use jQuery
            var element = $document[0].getElementById('video-test');

            console.log('B CallCtrl::element ', element);


            var stream = $scope.currentSession.getRemoteStreams()[0];

            stream.id = createUUID();

            console.log('session stream: ', stream);

            var videoEl = attachMediaStream(element, stream, {autoplay: true, mirror: false});

            console.log('17:02 C CallCtrl::videoEl ', videoEl);

            $document[0].getElementById('video-test').autoplay = true;



        }, 3000);


        // get the local stream, show it in the local video element and send it
        // copied from http://stackoverflow.com/questions/15501753/trouble-with-webrtc-in-nightly-22-and-chrome-25
        getUserMedia({'audio': true, 'video': true}, function(stream) {
            console.log('self stream: ', stream);
            // attach media stream to local video - WebRTC Wrapper
            attachMediaStream($document[0].getElementById('local-video'), stream);
            $document[0].getElementById('local-video').muted = true;
            $document[0].getElementById('local-video').autoplay = true;
            //peerConnection.addStream(stream);
            //
            //if (isCaller)
            //    peerConnection.createOffer(gotDescription);
            //else {
            //    peerConnection.createAnswer(gotDescription);
            //}
            //
            //function gotDescription(desc) {
            //    sendMessage(JSON.stringify({'sdp': desc}));
            //    peerConnection.setLocalDescription(desc);
            //
            //}
        }, function() {
        });

        /// currentCall.videoEl
        // var element =  document.getElementById('myVideo')


        //document.getElementById('vidContainer').appendChild(attachMediaStream(stream));


        // element.(attachMediaStream($scope.currentSession.getRemoteStreams()[0]));

        //attachMediaStream(element, $scope.currentSession.getRemoteStreams()[0]);

        function createUUID() {
            // http://www.ietf.org/rfc/rfc4122.txt
            var s = [];
            var hexDigits = '0123456789abcdef';
            for (var i = 0; i < 36; i++) {
                s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
            }
            s[14] = '4';  // bits 12-15 of the time_hi_and_version field to 0010
            s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
            s[8] = s[13] = s[18] = s[23] = '-';

            var uuid = s.join('');
            return uuid;
        }

    }]);
