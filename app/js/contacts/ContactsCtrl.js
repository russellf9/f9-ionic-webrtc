'use strict';

angular.module('f9-webrtc')

  .controller('ContactsCtrl', ['$scope', 'ContactsService', function ($scope, ContactsService) {
    $scope.contacts = ContactsService.onlineUsers;
  }]);