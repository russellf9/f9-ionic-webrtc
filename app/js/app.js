'use strict';

angular.module('f9-webrtc', ['ionic',  'ngDragDrop', 'angular.filter', 'f9-webrtc.controllers'])

    .config(function($stateProvider, $urlRouterProvider) {
        console.log('app::150312 - 14:35b');

        $stateProvider
            .state('app', {
                url: '/app',
                abstract: true,
                templateUrl: 'partials/app.html'
            })
            .state('app.login', {
                url: '/login',
                controller: 'LoginCtrl',
                templateUrl: 'partials/login.html'
            })
            .state('app.contacts', {
                url: '/contacts',
                controller: 'ContactsCtrl',
                templateUrl: 'partials/contacts.html'
            })
            .state('app.call', {
                url: '/call/:contactName?isCalling',
                controller: 'CallCtrl',
                templateUrl: 'partials/call.html'
            });

        $urlRouterProvider.otherwise('/app/login');
    })


    .run(function(_, $ionicPlatform) {
        $ionicPlatform.ready(function() {
            // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
            // for form inputs)
            if (window.cordova && window.cordova.plugins.Keyboard) {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            }

            if (window.StatusBar) {
                // org.apache.cordova.statusbar required
                StatusBar.styleDefault();
            }
        });
    })

    .run(function($state) {
        console.log('on - state: ', $state);
        //if (signaling) {
        //    signaling.on('messageReceived', function(name, message) {
        //        switch (message.type) {
        //            case 'call':
        //                if ($state.current.name === 'app.call') {
        //                    return;
        //                }
        //
        //                $state.go('app.call', {isCalling: false, contactName: name});
        //                break;
        //        }
        //    });
        //
        //}

    });
