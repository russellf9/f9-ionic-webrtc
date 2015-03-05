angular.module('f9-webrtc')

  .controller('ContactsCtrl', function ($scope, ContactsService) {
    $scope.contacts = ContactsService.onlineUsers;
  });