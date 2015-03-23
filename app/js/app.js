'use strict';

angular.module('f9-webrtc', ['ngCordova', 'ngRoute', 'ionic', 'ngDragDrop', 'angular.filter', 'f9-webrtc.controllers', 'f9-webrtc.filters'])

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


    .run(function(_, $ionicPlatform, $cordovaDevice) {
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

            var device = $cordovaDevice.getDevice(),
                cordova = $cordovaDevice.getCordova(),
                model = $cordovaDevice.getModel(),
                platform = $cordovaDevice.getPlatform(),
                uuid = $cordovaDevice.getUUID(),
                version = $cordovaDevice.getVersion();

            console.log('Ios device is a: ',model, ' using version ', cordova, ' of cordova, with platform ',platform );

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
