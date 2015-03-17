'use strict';

angular.module('f9-webrtc')
    .service('CTIService', ['ContactsService', '$rootScope', '$q', '$interval',
        function(ContactsService, $rootScope, $q, $interval) {
            var _password = 'Stat1onX!',
                _simpleCTI,
                data = {status: 0, code: -1, reason: ''};

            /**
             *
             * @param status
             * @param code
             * @param reason
             */
            function statusCB(status, code, reason) {
                console.log('14:33 ++++  statusCB | status, code, reason: ', status, code, reason);

                //this works
                if($rootScope.$root.$$phase != '$apply' && $rootScope.$root.$$phase != '$digest') {
                    $rootScope.$apply(function() {
                        data = {status: status, code: code, reason: reason};
                    });
                }
            }

            // Call event callback - we use the same callback for all three event types
            // and key off the first state parameter to work out what to do.
            function eventCB(state, number, party, call, line) {
                // var callstatus = document.getElementById('callstatus');
                // var statuspanel = document.getElementById('statuspanel');
                var description = '';
                console.log('got ' + state + ' event to number ' + number + ' we are the ' + party);
                switch (state) {
                    case 'ring':
                        description = 'Ringing: ';
                        break;
                    case 'up':
                        description = 'Answered: ';
                        break;
                    case 'dead':
                        description = 'Nothing Doing, last call was: ';
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
                //callstatus.innerHTML = description;
                //statuspanel.src = 'http://www.google.com/custom?q=' + number;
            }


            return {
                // simply returns the current login status
                getLoginData : function() {
                    return data;
                },


                online: function() {
                    return true;
                },


                // login function ( currently just checking if name is in the user base )
                login: function(name) {
                    console.log('User: ', name, ' logging in!');

                    // 1 test is in valid users
                    if (ContactsService.validUser(name)) {

                        // 2. will have to test the CTI Login success
                        _simpleCTI = new SimpleCTI(name.toLowerCase(), _password, statusCB, eventCB, eventCB, eventCB);
                        _simpleCTI.login();


                    } else {

                        console.log('User: ', name, ' is not authorized!');

                        // TODO handle invalid name

                    }
                }
            };
        }]);
