(function() {
    'use strict';

    angular.module('f9-webrtc')

        .controller('CallCtrl', ['$scope', '$state', '$rootScope', '$timeout', '$ionicModal', '$stateParams', 'CTIService', 'ContactsService', function($scope, $state, $rootScope, $timeout, $ionicModal, $stateParams, CTIService, ContactsService) {
            var duplicateMessages = [];

            $scope.callInProgress = false;

            $scope.isCalling = $stateParams.isCalling === 'true';
            $scope.contactName = $stateParams.contactName;

            $scope.allContacts = ContactsService.onlineUsers;
            $scope.contacts = {};
            $scope.hideFromContactList = [$scope.contactName];
            $scope.muted = false;

            $ionicModal.fromTemplateUrl('partials/select_contact.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function(modal) {
                $scope.selectContactModal = modal;
            });


            function call(isInitiator, contactName) {
                console.log(new Date().toString() + ': calling to ' + contactName + ', isInitiator: ' + isInitiator);

                var config = {
                    isInitiator: isInitiator,
                    turn: {
                        host: 'turn:ec2-54-68-238-149.us-west-2.compute.amazonaws.com:3478',
                        username: 'test',
                        password: 'test'
                    },
                    streams: {
                        audio: true,
                        video: true
                    }
                };

                var session = new cordova.plugins.phonertc.Session(config);

                session.on('sendMessage', function(data) {

                    if (!CTIService) {
                        console.log('signal not ready for message: ', data);
                        return;
                    }

                    CTIService.emit('sendMessage', contactName, {
                        type: 'phonertc_handshake',
                        data: JSON.stringify(data)
                    });
                });

                session.on('answer', function() {
                    console.log('Answered!');
                });

                session.on('disconnect', function() {
                    if ($scope.contacts[contactName]) {
                        delete $scope.contacts[contactName];
                    }

                    if (Object.keys($scope.contacts).length === 0) {

                        if (!CTIService) {
                            console.log('signal not working ');
                            $state.go('app.contacts');
                        }
                        CTIService.emit('sendMessage', contactName, {type: 'ignore'});
                        $state.go('app.contacts');
                    }
                });

                session.call();

                $scope.contacts[contactName] = session;
            }

            if ($scope.isCalling) {
                if (!CTIService) {
                    console.log('signal not ready for calling');
                }
                else {
                    CTIService.emit('sendMessage', $stateParams.contactName, {type: 'call'});
                }
            }

            $scope.ignore = function() {
                var contactNames = Object.keys($scope.contacts);
                if (contactNames.length > 0) {
                    $scope.contacts[contactNames[0]].disconnect();
                }
                else if (!CTIService) {
                    console.log('Error - no signalling');
                } else {
                    CTIService.emit('sendMessage', $stateParams.contactName, {type: 'ignore'});
                    $state.go('app.contacts');
                }

            };

            $scope.end = function() {
                Object.keys($scope.contacts).forEach(function(contact) {
                    $scope.contacts[contact].close();
                    delete $scope.contacts[contact];
                });

                if (typeof session !== 'undefined') {
                    session.close();
                }
            };

            $scope.answer = function() {
                if ($scope.callInProgress) {
                    return;
                }

                $scope.callInProgress = true;
                $timeout($scope.updateVideoPosition, 1000);

                call(false, $stateParams.contactName);

                setTimeout(function() {
                    console.log('sending answer');
                    CTIService.emit('sendMessage', $stateParams.contactName, {type: 'answer'});
                }, 1500);
            };

            $scope.updateVideoPosition = function() {
                $rootScope.$broadcast('videoView.updatePosition');
            };

            $scope.openSelectContactModal = function() {
                cordova.plugins.phonertc.hideVideoView();
                $scope.selectContactModal.show();
            };

            $scope.closeSelectContactModal = function() {
                cordova.plugins.phonertc.showVideoView();
                $scope.selectContactModal.hide();
            };

            $scope.addContact = function(newContact) {
                $scope.hideFromContactList.push(newContact);
                CTIService.emit('sendMessage', newContact, {type: 'call'});

                cordova.plugins.phonertc.showVideoView();
                $scope.selectContactModal.hide();
            };

            $scope.hideCurrentUsers = function() {
                return function(item) {
                    return $scope.hideFromContactList.indexOf(item) === -1;
                };
            };

            $scope.toggleMute = function() {
                $scope.muted = !$scope.muted;

                Object.keys($scope.contacts).forEach(function(contact) {
                    var session = $scope.contacts[contact];
                    session.streams.audio = !$scope.muted;
                    session.renegotiate();
                });
            };

            function onMessageReceive(name, message) {

                console.log('CallCtrl::onMessageReceive | name: ',name, ' | message: ', message);
                switch (message.type) {
                    case 'answer':
                        $scope.$apply(function() {
                            $scope.callInProgress = true;
                            $timeout($scope.updateVideoPosition, 1000);
                        });

                        var existingContacts = Object.keys($scope.contacts);
                        if (existingContacts.length !== 0) {
                            CTIService.emit('sendMessage', name, {
                                type: 'add_to_group',
                                contacts: existingContacts,
                                isInitiator: false
                            });
                        }

                        call(true, name);
                        break;

                    case 'ignore':
                        var len = Object.keys($scope.contacts).length;
                        if (len > 0) {
                            if ($scope.contacts[name]) {
                                $scope.contacts[name].close();
                                delete $scope.contacts[name];
                            }

                            var i = $scope.hideFromContactList.indexOf(name);
                            if (i > -1) {
                                $scope.hideFromContactList.splice(i, 1);
                            }

                            if (Object.keys($scope.contacts).length === 0) {
                                $state.go('app.contacts');
                            }
                        } else {
                            $state.go('app.contacts');
                        }

                        break;

                    case 'phonertc_handshake':
                        if (duplicateMessages.indexOf(message.data) === -1 ) {
                            // extra test
                            if ($scope.contacts[name] === 'undefined') {
                                return;
                            }
                            $scope.contacts[name].receiveMessage(JSON.parse(message.data));
                            duplicateMessages.push(message.data);
                        }

                        break;

                    case 'add_to_group':
                        message.contacts.forEach(function(contact) {
                            $scope.hideFromContactList.push(contact);
                            call(message.isInitiator, contact);

                            if (!message.isInitiator) {
                                $timeout(function() {
                                    CTIService.emit('sendMessage', contact, {
                                        type: 'add_to_group',
                                        contacts: [ContactsService.currentName],
                                        isInitiator: true
                                    });
                                }, 1500);
                            }
                        });

                        break;
                }
            }

            if (CTIService) {
                CTIService.on('messageReceived', onMessageReceive);
            }


            $scope.$on('$destroy', function() {
                if (CTIService) {
                    CTIService.removeListener('messageReceived', onMessageReceive);
                }

            });
        }]);
}());