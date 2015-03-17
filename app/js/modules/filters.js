'use strict';

angular.module('f9-webrtc.filters', [])
    // a simple filter to capitalize all the words
    .filter('capitalize', function() {
        return function(input, scope) {
            if(!input || input==='' || input === 'undefined') {
                return '';
            }
            return input.replace(/\w\S*/g, function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            });
        };
    });
