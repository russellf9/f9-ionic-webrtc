// The Magic Squares App
'use strict';

angular.module('app', ['ionic', 'ngDragDrop', 'angular.filter', 'app.controllers', 'app.services'])

    .run(function(_, $ionicPlatform) {
        $ionicPlatform.ready(function() {
            StatusBar.hide();
        });
    })

    .config(function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/');

        $stateProvider.state('menu', {
            url: '/',
            controller: 'Master',
            controllerAs: 'master',
            templateUrl: './partials/view-1.html'
        });
    });

