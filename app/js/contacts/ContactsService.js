angular.module('f9-webrtc')
    .factory('ContactsService', ['signaling', function(signaling) {
        var onlineUsers = [];

        if (!signaling) {
            console.log('signal not ready!')
        }

        if (signaling) {
            signaling.on('online', function(name) {
                if (onlineUsers.indexOf(name) === -1) {
                    onlineUsers.push(name);
                }
            });

            signaling.on('offline', function(name) {
                var index = onlineUsers.indexOf(name);
                if (index !== -1) {
                    onlineUsers.splice(index, 1);
                }
            });
        }

        return {
            onlineUsers: onlineUsers,
            setOnlineUsers: function(users, currentName) {
                console.log('users, currentName', users, currentName);
                this.currentName = currentName;

                onlineUsers.length = 0;
                users.forEach(function(user) {
                    if (user !== currentName) {
                        onlineUsers.push(user);
                    }
                });
                //onlineUsers.push(currentName); // hack for now...
                console.log('++++ online users: ', onlineUsers);
            }
        }
    }]);
