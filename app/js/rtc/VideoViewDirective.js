'use strict';

angular.module('f9-webrtc')
    .directive('videoView', function($rootScope, $timeout) {
        return {
            restrict: 'E',
            template: '<div class="video-container"></div>',
            replace: true,
            // the zero indexed element is the template - the video container
            link: function(scope, element, attrs) {
                function updatePosition() {
                  //  console.log('video - updatePosition! |element[0]: ',element[0]);
                    cordova.plugins.phonertc.setVideoView({
                        container: element[0],
                        local: {
                            position: [240, 240],
                            size: [50, 50]
                        }
                    });
                }

                $timeout(updatePosition, 500);
                $rootScope.$on('videoView.updatePosition', updatePosition);
            }
        };
    });