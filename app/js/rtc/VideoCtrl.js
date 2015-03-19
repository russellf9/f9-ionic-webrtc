'use strict';


// the controller for the video
// TODO to implement
angular.module('f9-webrtc')

    .controller('VideoCtrl', ['$scope',  '$document', function($scope, $document){

        // TODO
        // for some reason had to use jQuery
        var element = $document[0].getElementById('video-test');

        var stream = $scope.currentSession.getRemoteStreams()[0];

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

    }]);