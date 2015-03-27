'use strict';

// an angular service wrapper for the Chat
angular.module('f9-webrtc')
    .service('ChatService', ['ContactsService', '$rootScope', '$q', '$interval', '$state',
        function(ContactsService, $rootScope, $q, $interval, $state) {
            var lookup = {
                    room: {},
                    contact: {}
                },
                Chat;

            // create a room with all the users from the phone book
            var openRoom = function() {
                var numbers = ContactsService.getAllNumbers();
                console.log('ChatService::openRoom with numbers: ', numbers);
                numbers.push(113); // hack a known uid
                Chat.openRoom(numbers);
            };

            // status call back
            function statusCB(status, reason, code) {
                console.log('ChatService::statusCB ',status, reason, code);
                if (status) {
                    Chat.getOnline(contactCB);
                }
            }

            // contact call back - note the `cid` is not the phone number
            // cid: 113
            function contactCB(contact) {
                console.log('ChatService::contactCB() | contact: ', contact);
                if (lookup.contact[contact.cid]) {
                    if (!contact.online) {
                        lookup.contact[contact.cid].body.parentNode.removeChild(lookup.contact[contact.cid].body);
                        delete lookup.contact[contact.cid];
                    }
                    return;
                }
                lookup.contact[contact.cid] = {name: contact.name};
            }

            function roomCB(room) {
                console.log('ChatService::roomCB() | room: ', room);
                function post(e) {
                    var id = e.target.getAttribute('data-id');
                    if ( ! lookup.room[id] )
                        return;
                    Chat.postRoom(id, lookup.room[id].input.value);
                    lookup.room[id].input.value = '';
                }
                if ( lookup.room[room.id] ) {
                    if ( room.state == 'dead' ) {
                        lookup.room[room.id].body.parentNode.removeChild(lookup.room[room.id]);
                        delete lookup.room[room.id];
                        return;
                    }
                    if ( room.msg ) {
                        lookup.room[room.id].text.value += lookup.contact[room.msg.cid].name + ': ' +  room.msg.msg + '\n';
                        lookup.room[room.id].text.scrollTop = lookup.room[room.id].text.scrollHeight;
                    }
                    if ( room.name != lookup.room[room.id].name.nodeValue )
                        lookup.room[room.id].name.nodeValue = room.name;
                    return;
                }
                lookup.room[room.id] = {};
                //var html = [
                //    {elm: 'div', rtrn: 'body', attr: {class: 'room'}, chld: [
                //        {elm: 'div', chld: [
                //            {elm: 'text', rtrn: 'name', txt: room.name}
                //        ]},
                //        {elm: 'textarea', rtrn: 'text', attr: {class: 'messages'}},
                //        {elm: 'input', rtrn: 'input', attr: {class: 'input'}},
                //        {elm: 'button', attr: {class: 'button', 'data-id': room.id}, lstn: {click: post}, chld: [
                //            {elm: 'text', txt: 'post'}
                //        ]}
                //    ]}
                //];
                //buildHtml(html, document.getElementById('room-list'), lookup.room[room.id]);
            }


            return {
                init: function(name, password) {
                    console.log('ChatService::init');
                    Chat = new SimpleChat(name, password, statusCB, roomCB);
                },
                // wrapper for the ready()
                ready: function() {
                    Chat.ready();
                    openRoom();
                }
            };
        }]);

