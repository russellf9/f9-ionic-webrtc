'use strict';

// an angular service wrapper for the SimpleCTI
angular.module('f9-webrtc')
    .service('CTIService', ['ContactsService', '$rootScope', '$q', '$interval', '$state',
        function(ContactsService, $rootScope, $q, $interval, $state) {
            var _password = 'Stat1onX!',
                _simpleCTI,
                _currentSession,
                _phonertcSession,
                _config,
                _phoneRTC,
                _jsSip,
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

            // semi-duplicate of the function within the api
            // if the user is the callee at this point the _phoneRTC instance has not yet been created
            // @param session the RTCSession instance
            function tryingCB(object) {
                console.log('\n-------------');
                console.log('A CTIService::trying() | session: ', object.session);
                console.log('B CTIService::trying() | headers: ', object.request.headers);
                console.log('C CTIService::trying() | originator: ', object.originator);
                var _xIpcId = object.request.headers['X-Ipc-Id'];
                console.log('D CTIService::trying() | _xIpcId: ', _xIpcId);
                // do we have the sdp? - NO!
                // console.log('D CTIService::trying() | local streams: ', object.session.getLocalStreams());
                console.log('-------------\n');
            }


            // Call event callback - we use the same callback for all three event types
            // and key off the first state parameter to work out what to do.
            function eventCB(state, number, party, call, line) {
                var description = '',
                    session = {};

                _currentSession = call.get('session') || line.attr.session || {};

                _phonertcSession = line.attr.phonertcSession || {};
                _config = line.attr.config;
                _jsSip = line.attr.jssip;
                // _jsSip.on('newRTCSession', trying);

                console.log('\n-------------');
                console.log('CTIService::eventCB | call: ', call);

                var streams = call.get('remoteStreams');

                // console.log('CTIService::eventCB | streams: ', streams);

                // console.log('CTIService::eventCB | got session: ', _currentSession );

                // console.log('CTIService::eventCB | line: ', line);
                console.log('\n-------------');

                console.log('CTIService::eventCB | got ' + state + ' event to number ' + number + ' we are the ' + party);
                switch (state) {
                    case 'ring':
                        description = 'Ringing: ';
                        setData({status: true, code: 0, reason: 'ring', number: number, party: party});
                        break;
                    case 'up':
                        description = 'Answered: ';
                        try {
                            if (_currentSession) {
                                setData({status: true, code: 1, reason: 'up', number: number, party: party});
                            }
                        }
                        catch (error) {
                            console.log('Error ', error);
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
                    console.log('CTIService::getSession: ', _currentSession);
                    return _currentSession;
                },
                // simply returns the PhoneRTCSession
                getPhonertcSession: function() {
                    return _phonertcSession;
                },
                // requires the config
                getPhoneRTC: function(isInitiator) {
                    if (!_currentSession || !_config) {
                        console.log('No props');
                        return null;
                    }
                    _config.isInitiator = isInitiator;
                    if (!_phoneRTC) {
                        _phoneRTC = new JsSIPCordovaRTCEngine(_currentSession, _config);
                    }
                    return _phoneRTC;
                },
                clear: function() {
                    _phoneRTC = null;
                },
                // login function ( currently just checking if name is in the user base )
                login: function(name) {
                    console.log('CTIService::User: ', name, ' logging in!');
                    // 1 test is in valid users
                    if (ContactsService.validUser(name)) {
                        // 2. TODO will have to test the CTI Login success
                        _simpleCTI = new SimpleCTI(name.toLowerCase(), _password, statusCB, eventCB, eventCB, eventCB, tryingCB);
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
                    this.clear();
                },
                // answers the current call
                answer: function(id) {
                    _simpleCTI.answer(id);
                }
            };
        }]);

