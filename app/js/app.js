// The Magic Squares App

'use strict';

angular.module('magicsquares', ['ionic', 'ngDragDrop', 'angular.filter', 'magicsquares.controllers', 'magicsquares.services'])

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
            templateUrl: './partials/game.html'
        });
    });

