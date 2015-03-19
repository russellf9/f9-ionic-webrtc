'use strict';

// an angular service wrapper for the SimpleCTI
angular.module('f9-webrtc')
    .service('CTIService', ['ContactsService', '$rootScope', '$q', '$interval', '$state',
        function(ContactsService, $rootScope, $q, $interval, $state) {
            var _password = 'Stat1onX!',
                _simpleCTI,
                _currentSession,
                data = {status: 0, code: -1, reason: ''};

            // status call back
            function statusCB(status, code, reason) {
                console.log('CTIService::statusCB | status, code, reason: ', status, code, reason);
                data = {status: status, code: code, reason: reason};
                setData(data);
            }

            // sets the services data object
            function setData(value) {
                console.log('CTIService::setData');
                if ($rootScope.$root.$$phase != '$apply' && $rootScope.$root.$$phase != '$digest') {
                    $rootScope.$apply(function() {
                        data = value;
                    });
                }
            }

            // Call event callback - we use the same callback for all three event types
            // and key off the first state parameter to work out what to do.
            function eventCB(state, number, party, call, line) {
                var description = '',
                    session = {};

                _currentSession = call.get('session') || {};

                console.log('CTIService::eventCB | got ' + state + ' event to number ' + number + ' we are the ' + party);
                switch (state) {
                    case 'ring':
                        description = 'Ringing: ';
                        setData({status: true, code: 0, reason: 'ring', number: number, party: party});
                        break;
                    case 'up':
                        description = 'Answered: ';

                        if ( _currentSession &&  _currentSession.getRemoteStreams().length) {
                            setData({status: true, code: 1, reason: 'up', number: number, party: party});
                        }
                        // TODO Add a clause for there being no session?
                        break;
                    case 'dead':
                        description = 'Nothing Doing, last call was: ';
                        setData({status: false, code: -1, reason: 'dead', number: number, party: party});
                        break;
                }
                if (party == 'callee') {
                    description += number + ' calling us';
                } else {
                    description += 'calling ' + number;
                }
                if (state != 'dead') {
                    description += ' hangup';
                }
                if (state == 'ring' && party == 'callee') {
                    description += ' answer';
                }
            }

            return {
                // simply returns the current session data
                getCTIData: function() {
                    return data;
                },
                // TODO
                online: function() {
                    return true;
                },
                // simply returns the current session
                getSession: function() {
                    console.log('CTIService::getSession: ',_currentSession);
                    return _currentSession;
                },
                // login function ( currently just checking if name is in the user base )
                login: function(name) {
                    console.log('CTIService::User: ', name, ' logging in!');
                    // 1 test is in valid users
                    if (ContactsService.validUser(name)) {
                        // 2. TODO will have to test the CTI Login success
                        _simpleCTI = new SimpleCTI(name.toLowerCase(), _password, statusCB, eventCB, eventCB, eventCB);
                        _simpleCTI.login();
                    } else {
                        // simply reset the data, as the interested parties should be watching this object
                        var message = 'User: ' + name + ' is not authorized!';
                        data = {status: false, code: -1, reason: message};
                    }
                },
                // dials the supplied contact
                dial: function(contact) {
                    _simpleCTI.dial(contact.number);
                },
                // hangs up the current call
                hangup: function(id) {
                    _simpleCTI.hangup(id);
                },
                // answers the current call
                answer: function(id) {
                    _simpleCTI.answer(id);
                }
            };
        }]);

