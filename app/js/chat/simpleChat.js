'use strict';

/**
 * Really simple example of a chat class that allows client side Javascript to interact
 * with an ipcortex keevio chat system
 */

var SimpleChat = (
    /**
     * Creates a new SimpleChat singleton and initialises it with the user info
     * that it will use to authenticate against the PBX. Provide two callbacks:
     * when created:
     *   status: for API initialisation success/failure
     *   room: for all room create/destroy/message events
     *
     * @constructor
     *
     * @param {String} username A valid PBX username for a user who owns a phone
     * @param {String} password Password
     * @param {SimpleChat~statusCallback} status to call on error or successful API initialisation
     * @param {SimpleChat~roomCallback} room to call when a chat room event occurs
     *        See roomUpdate() for details.
     */
        function(username, password, status, room) {


        console.log('new SimpleChat!');
        var isReady = false;
        var tmp = {};
        var rooms = {};
        var online = {};

        var lookup = {
            contact: {},
            room: {}
        };

        var active = {
            xmppid: null,
            callback: null
        };

        var CB = {
            room: room,
            status: status
        };

        /**
         * Internal method to handle authentication-OK and the resultant
         * starting of API
         *
         * @private
         */
        function authCB(ok) {
            if (ok) {
                IPCortex.PBX.startPoll(go, error);
            } else {
                CB.status(false, -1, "Login failed");
            }
        }

        /**
         * Internal method to handle API startup FAILURE  - Used by authCB
         *
         * @private
         */
        function error(n, m) {
            CB.status(false, n, m);
            console.error('We got an error number: ' + n + ' Text: ' + m);
        }

        /**
         * Internal method to handle API startup SUCCESS  - Used by authCB
         *
         * @private
         */
        function go() {
            console.log('SimpleChat.go()');
            IPCortex.PBX.enableChat(roomCB);
            CB.status(true, 0, "API Initialised");
        }

        /**
         * Internal method to handle simplification of callback data provided by room API.
         * The 'room' callback is called with a simple object containing the following
         * attributes whenever a room changes state, or a new message arrives:
         *
         *    id:        A unique room ID number.
         *    name:        The name of the room, this can change over time.
         *    state:        The state of the room, typically 'invited', 'inviting', 'open', 'closed' or 'dead'
         *            NOTE: After a call with 'dead' the room ceases to exist and
         *                should be cleaned up and not used again.
         *    members:    An array containing a list of joined members in the room.
         *    invited:    An array containing a list of invited members who have not since closed the room.
         *    msg:        null = no new messages, or {cid: sender_id, time: timestamp_of_message, msg: message_text}
         *
         * @private
         */
        function roomUpdate(filter, hid, room) {
            console.log('Chat::roomUpdate: ', filter, hid, room);
            var data = {
                id: room.get('roomID'),
                name: room.get('name'),
                state: room.get('state'),
                members: room.get('joined').sort(),
                invited: room.get('linked').sort(),
                msg: null
            };
            var tmp = [];
            var msgs = room.get('msgs') || [];
            for (var i = 0; i < msgs.length; i++) {
                if (msgs[i].cN != 'SYSTEM') {
                    tmp.push({
                        cid: msgs[i].cID,
                        time: msgs[i].time,
                        msgid: msgs[i].msgID,
                        txt: msgs[i].msg
                    });
                }
            }
            if (tmp.length) {
                for (var i = 0; i < tmp.length; i++) {
                    data.msg = tmp[i];
                    CB.room(data);
                }
            } else {
                CB.room(data);
            }
        }

        /**
         * Internal method to handle new-room callbacks from the API, invite missing users if needed
         * and hook the room for further updates from the API.
         *
         * @private
         */
        function roomCB(room) {
            console.log('Chat::roomCB', room);
            lookup.room[room.get('roomID')] = room;
            roomUpdate(null, null, room);
            room.hook(roomUpdate);
        }

        /**
         * Internal method to handle updates to contact online/offline states.
         * CB.address callback is supplied when 'getOnline' is called.
         *
         * @private
         */
        function addressUpdate(filter, hid, address) {
            console.log('Chat::addressUpdate', address);
            if (address.get('online') && !online[address.get('cid')]) {
                online[address.get('cid')] = true;
                CB.address({
                    cid: address.get('cid'),
                    name: address.get('name'),
                    online: true
                });
            } else if (!address.get('online') && online[address.get('cid')]) {
                delete online[address.get('cid')];
                CB.address({
                    cid: address.get('cid'),
                    name: address.get('name'),
                    online: false
                });
            }
        }

        /**
         * Internal method which understands how to handle the API address callback.
         *
         * @private
         */
        function addressCB(address, deleted) {
            for (var i = 0; i < address.length; i++) {
                lookup.contact[address[i].get('cid')] = address[i];
                address[i].hook(addressUpdate);
            }
        }

        /**
         * Used by the API initialisation process
         */
        onAPILoadReady = (
            function() {
                console.log('Chat onAPILoadReady!');
                IPCortex.PBX.Auth.login(username, password, null, authCB);
            }
        );

        return {
            //  forces the go() call
            ready: function() {
                if (!isReady) {
                    go();
                }
                isReady = true;
            },
            /**
             * Request a list of online contacts. Results are returned one contact at a time
             * via the supplied callback. Call back is called with an object having the
             * properties:
             *
             *    cid:    contact's ID
             *    name:    contact's Name
             *    online:    true/false
             *
             * If a contact changes state, the callback will be called again with the updated
             * online status.
             *
             * @param {SimpleChat~contactCallback} cb Callback to call on address entry change.
             */
            getOnline: function(cb) {
                if (typeof(cb) != 'function') {
                    return false;
                }
                for (var cid in online) {
                    if (online.hasOwnProperty(cid)) {
                        cb(online);
                        return;
                    }
                }
                IPCortex.PBX.getAddressbook(addressCB);
                CB.address = cb;
            },
            /**
             * Open a new room.
             *
             * @param {Number} cids[] An array of contact IDs to include in the room.
             */
            openRoom: function(cids) {
                console.log('Chat openRoom()');
                cids = [].concat(cids);
                function cb(a, b) {
                    /* TODO: Handle error response */
                    console.log('Chat cb: ', a, b);
                }
                /* TODO: support multiple outstanding rooms! */
                try {
                    IPCortex.PBX.chatInvite(cids, cb);
                }
                catch (error) {
                    console.log('chatInvite Error: ', error);
                }
            },
            /**
             * Rename an existing room.
             *
             * @param {Number} roomID The ID of the room to rename
             * @param {String} name The new name of the room
             */
            renameRoom: function(roomID, name) {
                if (!lookup.room[roomID]) {
                    return false;
                }
                lookup.room[roomID].modify({name: name, gomulti: true});
            },
            /**
             * Get owner ID of room (null if none or unknown)
             *
             * @param {Number} roomID The ID of the room to rename
             */
            getOwnerId: function(roomID) {
                if (!lookup.room[roomID]) {
                    return false;
                }
                return lookup.room[roomID].get('owner');
            },
            /**
             * Leave a room. Other members will remain in the room.
             *
             * @param {Number} roomID The ID of the room to rename
             */
            leaveRoom: function(roomID) {
                if (!lookup.room[roomID]) {
                    return false;
                }
                lookup.room[roomID].leave();
            },
            /**
             * Post a message into a room.
             *
             * @param {Number} roomID The ID of the room to rename
             * @param {String} msg The message to post
             */
            postRoom: function(roomID, msg) {
                if (!lookup.room[roomID]) {
                    return false;
                }
                lookup.room[roomID].post(msg);
            }
        };
    }
);