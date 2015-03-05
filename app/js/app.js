'use strict';

angular.module('f9-webrtc', ['ionic', 'ngDragDrop', 'angular.filter', 'f9-webrtc.controllers'])

    .config(function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/');

        $stateProvider.state('app', {
            url: '/',
            controller: 'Master',
            controllerAs: 'master',
            templateUrl: './partials/view-1.html'
        });
    })


    .run(function(_, $ionicPlatform) {
        $ionicPlatform.ready(function() {
            StatusBar.hide();
        });
    });
