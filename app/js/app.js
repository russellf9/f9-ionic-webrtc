'use strict';

angular.module('f9-webrtc', ['ngRoute', 'ionic', 'ngDragDrop', 'angular.filter', 'f9-webrtc.controllers', 'f9-webrtc.filters'])

    .config(function($stateProvider, $urlRouterProvider) {
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
                url: '/call/:contactName',
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
            // TODO move
            // add the functionality for the new SIP stuff
            var SIP = cordova.require("com.onsip.cordova.Sipjs");
            var PhoneRTCMediaHandler = cordova.require("com.onsip.cordova.SipjsMediaHandler")(SIP);

            //console.log('---------');
            //console.log('APP = 16:48');
            //console.log('SIP ',SIP);
            //console.log('PhoneRTCMediaHandler ',PhoneRTCMediaHandler);
            //console.log('---------');

            //window.ua = new SIP.UA({
            //    uri:                 'my_user...@domain.onsip.com',
            //    authorizationUser:   'sip_username',
            //    password:            'password',
            //    mediaHandlerFactory: PhoneRTCMediaHandler
            //});

        });
    })

    .run(function($state) {
        console.log('app - on - state: ', $state);
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
