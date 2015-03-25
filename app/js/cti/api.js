/*
 * @copyright  (c) 2005-2015 IP Cortex Ltd. All rights reserved. Unauthorised copying is not permitted.
 */

/**
 * @fileOverview Interface to IPCortex PABX
 */

/**
 * @namespace Callback
 * @description Container for all callbacks - These are implemented by the front-end app., so are purely documentation.
 */
/** @namespace IPCortex.PBX */
var IPCortex = IPCortex || {};
IPCortex.XHR = IPCortex.XHR || {};
IPCortex.PBX = (function() {
	var gHid = 1;
	var mbFreq = 0;
	var errorCB = null;
	var intervalID = null;
	var mediaStream = null;
	var startPollCalled = null;
	var handles = {};
	var devToExt = {};
	var extToDev = {};
	var extByExt = {};
	var macToPhn = {};
	var devToMac = {};
	var loadCache = {};
	var hidStruct = {};
	var webrtcPass = {};
	var deviceHooks = {};

	var ports = {
		tmpld:		82,
		tmplds:		443,
		ws:		8088,
		wss:		443
	};

	var live = {
		hdCID:		null,
		origSID:	'',
		md5Hash:	{},
		extToCid:	{},
		extToDDI:	{},
		origURI:	location.protocol == 'https:' ? 'https://' : 'http://',
		origHost:	location.host,
		origHostPort:	location.host,
		scriptPort:	location.protocol == 'https:' ? ports.tmplds : ports.tmpld,
		userData:	{},
		cidToUsr:	{},
		cidToPhn:	{},
		cidCache:	{},
		xmppRoster:	{},
		addressBook:	{},
		hotdesk_owner:	{},
		hotdesked_to:	{},
		turnServers:    [],
		stunServer:	'',
		inviteUrl:	''
	};

	var flags = {
			loading:	true,
			parsing:	{livefeed: false, lines: false, address: false, roster: false},
			initialHD:	false
	};

	var counters = {
			hdSequence:	null,
			xmppSequence:	null
	};

	var callbacks = {};

	var lookUp = {
			hid:		{},
			dev:		{},
			que:		{},
			mbx:		{},
			cnt:		{},
			xmpp:		{},
			room:		{},
			addr:		{},
			qcall:		{}
	};

	var aF = {
			max:		0,
			maxMb:		0,
			count:		0,
			inuse:		0,
			fail:		0,
			queue:		[]
	};

	var cH = {
			count:		0,
			enabled:	0,
			initial:	0,
			xmpp:		null,
			roomCB: 	null,
			presenceCB:	null,
			online:		null,
			newOnline:	null,
			rooms:		[],
			seen:		{}
	};

	var hI = {
			enabled:	0,
			timeout:	null,
			saved:		(new Date()).getTime(),
			updated:	(new Date()).getTime(),
			cb:		null,
			cache:		{},
			devices:	{},
			history:	[]
	};

	var specialFeatures = {
			handlers:	{},
			callbacks:	{},
			transports:	{}
	};

	var translate = [
		{a:	'stamp',	s:	'sp'},
		{a:	'start',	s:	'st'},
		{a:	'end',		s:	'ed'},
		{a:	'party',	s:	'pt'},
		{a:	'id',		s:	'id'},
		{a:	'info',		s:	'if'},
		{a:	'note',		s:	'no'},
		{a:	'number',	s:	'nr'},
		{a:	'extension',	s:	'ex'},
		{a:	'extname',	s:	'en'},
		{a:	'name',		s:	'ne'},
		{a:	'device',	s:	'dv'},
		{a:	'inq',		s:	'iq'},
		{a:	'outq',		s:	'oq'},
		{a:	'devname',	s:	'dn'}
	];

	if ( typeof navigator != 'undefined' ) {
		if ( navigator.mozGetUserMedia )
			mediaStream = MediaStream || LocalMediaStream;
		else if ( navigator.webkitGetUserMedia )
			mediaStream = webkitMediaStream;
	}

	if ( ! Array.isArray ) {
		Array.isArray = function(a) { return (a instanceof Array); };
	}

	var Utils = {};
	for ( var x in IPCortex.Utils ) {
		Utils[x] = IPCortex.Utils[x];
	}

	/**
	 * Utility to test whether passed-in object is an Browser or RTC Media Stream
	 * @memberOf IPCortex.Utils
	 */
	isMediaStream = IPCortex.Utils.isMediaStream = function(o) {
		if ( mediaStream && o instanceof mediaStream )
			return true;
		else if ( o != null && typeof o == 'object' && o.isTemMediaStream )
			return true;
		return false;
	}

	/** 
	 * Periodically polled at 1000ms to fetch data from tmpld.pl 
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function checkInterval() {
		if ( aF.fail > 20 || aF.inuse < 0 ) {
			aF.inuse = 0;
			aF.queue = [];
		}
		if ( aF.inuse > 0 ) {
			aF.fail++;
			return;
		}
		aF.fail = 0;

		/* Poll for the regular user data */
		scriptAf(live.origURI + live.origHost + ':' + live.scriptPort + '/' + ((new Date()).getTime()) + '/?maxdata=' + aF.max +
				'&alldata=14' +
				'&searchq=1' +
				'&searchmb=0' +
				'&finish=2' +
				'&chat=' + cH.enabled +
				(flags.initialHD ? '&initial=1' : ''));

		/* After a hotdesk event we need to grab a load of additional device data */
		while ( Array.isArray(flags.refreshData) && flags.refreshData.length > 0 ) {
			var _getlist = flags.refreshData.slice(0, 5);
			flags.refreshData = flags.refreshData.slice(5);
			scriptAf(live.origURI + live.origHost + ':' + live.scriptPort + '/' + ((new Date()).getTime()) + '/?devlist=' + (_getlist.join(',')) +
				'&maxdata=0' +
				'&alldata=14' +
				'&searchq=0' +
				'&searchmb=0');
		}
 
		if( mbFreq > 4 ) {
			var _mbList = [];
			for ( var x in lookUp.mbx )
				_mbList.push(x);
			scriptAf(live.origURI + live.origHost + ':' + live.scriptPort + '/' + ((new Date()).getTime()) + '/?maxdata=' + aF.maxMb +
					'&devlist=' + _mbList.join(',') +
					'&alldata=0' +
					'&searchq=0' +
					'&searchdev=0' +
					'&searchmb=1' +
					'&finish=0');
			mbFreq = 0;
		}
		mbFreq++;

		/* If history is enabled, auto-save every 15 minutes */
		if ( hI.enabled && ((new Date()).getTime() - hI.saved) > 900000 )
			saveHistory();
	}

	/**
	 * Add a URL to the queue of tmpld.pl requests to make.
	 * @param {String} scurl Full URL to add.
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function scriptAf(scurl) {
		if ( ! Utils.isEmpty(scurl) )
			aF.queue.push(scurl);
		if ( aF.inuse > 0 || aF.queue.length <= 0 )
			return;
		scurl = aF.queue.shift();

		function callback(res) {
			IPCortex.XHR.results.push(res);
			IPCortex.XHR.xmlHttpReady();
			scriptAf();
		}

		Utils.httpPost(scurl.split('?')[0], scurl.split('?')[1], callback);

		aF.inuse++;
		aF.count++;
	}

	/**
	 * Receive and parse a line of data from tmpld.pl - Phone related
	 * @param {Object} response A javascript Object to be parsed
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function parseAf(response) {
		for ( var _key in response ) {
			if ( _key.search(/^\d+@/) != -1 ) {
				if ( ! lookUp.mbx[_key] )
					lookUp.mbx[_key] = mailbox.create(_key);
				lookUp.mbx[_key].update(response[_key]);
/* TODO work out how to expire old mailboxes */
			} else if ( _key.search(/^Queue\/q_.+$/) != -1 ) {
				if ( ! lookUp.que[_key] )
					lookUp.que[_key] = queue.create(_key);
				lookUp.que[_key].update(response[_key]);
			} else if ( _key == 'Queue/default' ) {
				/* No-Op we really do want to ignore this */
			} else if ( _key.search(/^Custom\//) == -1 ) {
				if ( ! lookUp.dev[_key] )
					lookUp.dev[_key] = device.create(_key);
				lookUp.dev[_key].status(_key, response[_key]);
				if ( response[_key].device ) {
					if ( response[_key].device.calls )
						lookUp.dev[_key].update(response[_key].device.calls);
					if ( response[_key].device.mailbox ) {
						var _mbx = response[_key].device.mailbox;
						if ( _mbx.search(/^\d+@/) != -1 && ! lookUp.mbx[_mbx] )
							lookUp.mbx[_mbx] = mailbox.create(_mbx);
					}
				}
				deviceHooks[_key] = lookUp.dev[_key];
				/* If hotdesked on, trigger either the hotdesker's phone, or contact as appropriate */
				if ( live.hotdesked_to[_key] ) {
					if ( lookUp.dev[live.hotdesked_to[_key]] )
						deviceHooks[live.hotdesked_to[_key]] = lookUp.dev[live.hotdesked_to[_key]];
					else if ( live.hotdesked_to[_key].substr(0,8) == 'Hotdesk/' ) {
						var _ext = live.hotdesked_to[_key].substr(8);
						var _cid = extByExt[_ext].owner;
						if ( _cid && lookUp.cnt[_cid] )
							deviceHooks[live.hotdesked_to[_key]] = lookUp.cnt[_cid];
					}
				}
			} else if ( _key.search(/^Custom\/\d+$/) != -1 || _key.search(/^Custom\/.+@.+$/) != -1 ) {
				if ( ! lookUp.xmpp[_key] ) {
					lookUp.xmpp[_key] = xmpp.create(_key);
					if ( live.userData.id && _key == 'Custom/' + live.userData.id )
						cH.xmpp = lookUp.xmpp[_key];
				}
				if ( response[_key].customData )
					lookUp.xmpp[_key].status(response[_key].customData.eXxmpp, response[_key].customData.xmpp, response[_key].customData.optout);
				else
					lookUp.xmpp[_key].status();
				deviceHooks[_key] = lookUp.xmpp[_key];

				/* Custom/<cid> records can contain hotdesk opt in/out data for <cid>.
				 * We need to determine if someone needs to know about this change...
				 */
				if ( _key == 'Custom/' + live.userData.id || live.adminID == live.userData.id ) {
					var _nameByDev = null;
					var _user = live.cidToUsr[live.userData.id];
					var _nameByExt = 'Hotdesk/' + _user.extension;
					if ( _user.phone )
						_nameByDev = macToPhn[_user.phone + '' + _user.port].devices[0];
					_inform = live.hotdesk_owner[_nameByDev] || live.hotdesk_owner[_nameByExt];
					if ( _inform )
						deviceHooks[_inform] = lookUp.dev[_inform];
				}
//			} else if ( ! response[_key].blf && _key.search(/^Custom\//) == -1 ) {
//				if ( response[_key].company && response[_key].company == live.userData.home )
//					console.log('Error dropped parseAf for ' + _key + ' (no BLF) but its in our company ' + response[_key].company + ' != ' + live.userData.home);
			} else
				console.log('Error dropped parseAf for ' + _key);

			if ( _key.search(/^\d+@/) != -1 && response[_key].sequence > aF.maxMb )
				aF.maxMb = response[_key].sequence;
			else if ( response[_key].sequence > aF.max )
				aF.max = response[_key].sequence;
		}
	}

	/**
	 * Receive and parse a line of data from tmpld.pl - Chat related
	 * @param {Object} response A javascript Object to be parsed
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function parseCh(response) {
		if ( ! cH.enabled )	/* Should never happen, but... */
			return;
		cH.count = 0;
		var _time = Math.floor(new Date().getTime() / 1000);
		RESPONSE:
		for ( var _room in response ) {
			var _linkNo = 0; 
			var _linkID = null;
			var _online = false;
			var _linked = response[_room].linked;
			var _joined = response[_room].joined;
			if ( _joined.length == 0 && (! cH.initial || _linked.length < 2) )
				continue;
			cH.seen[_room] = true;
			if ( response[_room].roomName.search(/_\d+_/) != -1 ) {
				if ( response[_room].roomName == '_' + live.userData.id + '_' && _joined.length == 1 && _joined[0] == live.userData.id ) {
					_linkID = live.userData.id;
					_online = true;
				} else {
					/* Should not occur! */
					delete cH.seen[_room];
					continue;
				}
			} else if ( response[_room].roomName.search(/^-?\d+\|[^\|]*\|\d+\|[^\|]*$/) != -1 ) {
				var _rName = response[_room].roomName.split('|');
				if ( _rName[_linkNo] == live.userData.id )
					_linkNo = 2;
				_linkID = _rName[_linkNo];
				for ( var i = 0; i < _joined.length; i++ ) {
					if ( live.userData.id != _joined[i] )
						continue;
					if ( _rName[(_linkNo == 0 ? 3 : 1)] == '' )
						break;
					// Joined with non OCM resource.
					if ( _rName[(_linkNo == 0 ? 3 : 1)] != ('ocm' + live.userData.id) ) {
						if ( lookUp.room[_room] ) {
							lookUp.room[_room].set('state', 'dead');
							lookUp.room[_room].run();
						}
						continue RESPONSE;
					}
					break;
				}
			} else if ( response[_room].roomName.search(/^@\d*,[a-zA-Z0-9 \-\.\']+$/) != -1 ) {
				/* What else do we need to do here? */
				if ( Utils.isInArray(_joined, live.userData.id) )
					_linkID = live.userData.id;
			}
			if ( ! _linkID )
				continue;
			if ( ! lookUp.room[_room] ) {
				lookUp.room[_room] = room.create(_linkID, _room);
				cH.seen[_room] = 'new';		/* New room or room after a reload */
			}
			lookUp.room[_room]._members(_linked);	/* Call to members to check for changes? */
			lookUp.room[_room].set(null, {roomName: response[_room].roomName, update: _time, linked: _linked, joined: _joined});
			if ( response[_room].key )
				lookUp.room[_room].set('key', response[_room].key);
			else
				lookUp.room[_room].set('key', null);
			if ( _online )
				cH.newOnline = lookUp.room[_room];
			if ( ! response[_room].poll )
				continue;
			var _msgInfo = null;
			try {
				_msgInfo = eval(response[_room].poll);
			} catch(e) {
				continue;
			}
			if ( typeof(_msgInfo) != 'object' || ! (Array.isArray(_msgInfo.messages)) )
				continue;
			var _msgs = _msgInfo.messages;
			_msgs.sort(function(a, b) { return (a.msgID > b.msgID) ? 1 : ( a.msgID < b.msgID ? -1 : 0 ); });

			/* Standard message push/post loop */
			for ( var i = 0; i < _msgs.length; i++ ) {
				if ( live.cidCache[_msgs[i].cID] && live.cidCache[_msgs[i].cID].name )
					_msgs[i].cN = live.cidCache[_msgs[i].cID].name;
				lookUp.room[_room].push({
					cID:	_msgs[i].cID,
					cN:	_msgs[i].cN,
					msg:	decodeURIComponent(_msgs[i].msg),
					msgID:	_msgs[i].msgID,
					time:	_msgs[i].time
				});
			}
		}
	}

	/**
	 * Receive and parse a line of data from tmpld.pl - Mostly hotdesking related
	 * @param {Object} response A javascript Object to be parsed
	 * @param {Number} sequence Sequence number that indicates when HD changes have occurred
	 * @param {String} xmpp_seq Sequence id that indicates when XMPP changes have occurred
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function parseHd(response, sequence, xmpp_seq) {
		if ( sequence != null && (counters.hdSequence == null || sequence > counters.hdSequence) ) {
			flags.initialHD = true;
			if ( counters.hdSequence != null ) {
				refreshLines();		/* Only need to refresh usrToPhn, and when done, re-call getLines callback !!! */
			}
			counters.hdSequence = sequence;
		}
		if ( xmpp_seq && counters.xmppSequence != xmpp_seq ) {
			counters.xmppSequence = xmpp_seq;
			function check() {
				if ( flags.parsing.roster ) {
					setTimeout(check, 250)
					return;
				}
				return _addressReady(); /* Push roster changes withour reloading addresses or users. */
			}
			if ( ! flags.parsing.roster ) {
				getRoster();
			}
			check();
		}
		if ( response == null )
			return;
		flags.initialHD = false;

		/* Cause all hotdesk devices to be updated. Just in case. */
		for ( var x in live.hotdesk_owner )
			deviceHooks[x] = lookUp.dev[x];
		for ( var x in live.hotdesked_to )
			deviceHooks[x] = lookUp.dev[x];

		/* Record all of the new HD response data */
		var _last_hotdesk_owner = live.hotdesk_owner;
		var _last_hotdesk_to = live.hotdesked_to;
		var _want_data = {};
		live.hotdesk_owner = {};
		live.hotdesked_to = {};
		for ( var x in response ) {
			if ( _last_hotdesk_owner[x] == null || _last_hotdesk_owner[x] != response[x] )		// New entry, or changed... add it
				_want_data[x] = true;
			if ( _last_hotdesk_to[response[x]] == null || _last_hotdesk_to[response[x]] != x )	// New entry, or changed... add it
				_want_data[response[x]] = true;

			live.hotdesk_owner[x] = response[x];
			live.hotdesked_to[response[x]] = x;
		}
		_last_hotdesk_owner = _last_hotdesk_to = null;

		/* All of the changes to HD since the last update need a maxdata = 0 fetch */
		if ( ! (Array.isArray(flags.refreshData)) )
			flags.refreshData = [];
		for ( var x in _want_data )
			flags.refreshData.push(x);
	}

	/**
	 * Receive and parse a line of data from tmpld.pl - Indicates end of a response
	 * @param {Number} [code] Returns the code number from the original request
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function finishAf(code) {
		aF.inuse--;
		var _chatHooks = {};
		if ( flags.loading && code == 2 )
			flags.loading = false;
		for ( var k in deviceHooks ) {
			var _device = deviceHooks[k];
			delete deviceHooks[k];
			if ( _device == null )
				continue;
			if ( _device instanceof contact && typeof(_device.update) == 'function' )
				_device.update();
			if ( typeof(_device.run) == 'function' )
				_device.run();
			var _calls = _device.get('calls');
			for ( var _call in _calls ) {
				var _tmp = _calls[_call];
				if ( _tmp.get('state') == 'dead' )
					_tmp.get('device').remove(_tmp);
			}
		}
		if ( code == 2 && cH.enabled ) {
			/* Rooms we got an update for */
			for ( var _room in lookUp.room ) {
				if ( lookUp.room[_room].update() )
					_chatHooks[_room] = true;
			}
			if ( ! cH.count ) {
				cH.online = cH.newOnline;
				cH.newOnline = null;
			}
			/* Rooms that we got NO update for but should have??? */
			var _oId = 0;
			if ( cH.online && cH.online.attr && cH.online.attr.id )
				_oId = cH.online.attr.roomID;
			if ( cH.seen[_oId] ) {
				cH.initial = 0;
				for ( var _room in lookUp.room ) {
					if( _oId == _room )
						continue;
					if ( !cH.seen[_room] && document.cookie.indexOf("tmpld_chat_" + _room + "=") != -1 ) {
						lookUp.room[_room].set('state', 'dead');
						_chatHooks[_room] = true;
					}
				}
			}
			for ( var x in _chatHooks ) {
				var _room = lookUp.room[x];
				if ( typeof(_room.run) == 'function' )
					_room.run();
			}
			for ( var x in cH.seen ) {
				cH.initial = 0;
				if ( cH.seen[x] == 'new' && x != _oId && lookUp.room[x] )
					feature.initial(lookUp.room[x]);
			}
			if ( ! _oId || ! cH.seen[_oId] ) { /* Chat enabled but no online room */
				/* Go online - someone probably killed our room */
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
									'cmd=create&type=room' +
									'&name=_' + live.userData.id + '_' +
									'&id=' + live.userData.id + 
									'&autoclean=5');
			}
			if ( cH.count > 9 ) {
				cH.count = 0;
				cH.online = null;
				cH.newOnline = null;
			}
			cH.count++;
		}
		cH.seen = {};
	}

	/**
	 * Receive and parse a line of data from tmpld.pl - Indicates an error condition.
	 *       1 - Template error. Just keep trying?
	 *       2 - Auth error. Drop to login screen?
	 *       3 - Asterix is reconnecting. Keep trying.
	 * @param {Number} code The error number
	 * @param {String} text Text describing the error
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function tmplErr(code, text) {
		aF.inuse--;
		clearInterval(intervalID);
		intervalID = null;
		if ( typeof errorCB == 'function' )
			errorCB(code, text);
	}

	/**
	 * Get client clock time drift.
	 * @return {Object} An object containing clientTime, serverTime and driftTime in seconds.
	 * @memberOf IPCortex.PBX
	 */
	function getTimeDelta(cb) {
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=gettime', parseTime);
		function parseTime(xml) {
			var now = (new Date()).getTime() / 1000;
			if ( xml.search(/success/) == -1 )
				server = now;
			else {
				xml = xml.split('\n')[1];
				server = xml.replace(/^.*time="(.*?)".*$/m, "$1");
			}
			cb({clientTime: now, serverTime: server, driftTime: Math.round((now - server) * 1000) / 1000});
		}
	}


	/**
	 * Request that any 'maxdata' state is cleared. This causes state for all devices to be updated.
	 * Do NOT use this function lightly as it will add significant load to the PABX.
	 * @memberOf IPCortex.PBX
	 */
	function clearMaxData() {
		aF.cleared = aF.cleared || 0;
		if ( ((new Date()).getTime() - aF.cleared) < 60000 )	/* High load operation. allowed every 60 seconds max */
			return false;
		aF.cleared = (new Date()).getTime();

		aF.max = 0;
		aF.maxMb = 0;
		for ( var _room in lookUp.room )
			lookUp.room[_room].clear();
	}

	/**
	 * Parse and act on a response from a call to api.whtm, making response data available.
	 * @param script A javascript Object to be parsed
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function parseAPI(script) {
		var _tmp = {};
		var _newData = {};
		var _order = ['livefeed', 'lines', 'users', 'address', 'roster'];
		var _check = {
				livefeed: {
					list: {
						origSID:     function(x) { if ( typeof(x) == 'string' ) { _newData.origSID = x; return true; } return false; },
						inviteUrl:   function(x) { if ( typeof(x) == 'string' ) { _newData.inviteUrl = x; return true; } return false; },
						stunServer:  function(x) { if ( typeof(x) == 'string' ) { _newData.stunServer = x; return true; } return false; },
						turnServers: function(x) { if ( typeof(x) == 'object' ) { _newData.turnServers = x; return true; } return false; },
						origSID:     function(x) { if ( typeof(x) == 'string' ) { _newData.origSID = x; return true; } return false; },
						origHost:    function(x) { if ( typeof(x) == 'string' ) { _newData.origHost = x; return true; } return false; },
						userData:    function(x) { if ( typeof(x) == 'object' ) { _newData.userData = x; return true; } return false; },
						cidToUsr:    function(x) { if ( typeof(x) == 'object' ) { _newData.cidToUsr = x; return true; } return false; },
						cidToPhn:    function(x) { if ( typeof(x) == 'object' ) { _newData.cidToPhn = x; return true; } return false; },
						companies:   function(x) { if ( typeof(x) == 'object' ) { _newData.companies = x; return true; } return false; },
						extToCid:    function(x) { if ( typeof(x) == 'object' ) { _newData.extToCid = x; return true; } return false; },
						extToDDI:    function(x) { if ( typeof(x) == 'object' ) { _newData.extToDDI = x; return true; } return false; },
						adminID:     function(x) { if ( typeof(x) == 'number' ) { _newData.adminID = x; return true; } return false; },
						hdCID:       function(x) { if ( typeof(x) == 'string' ) { _newData.hdCID = x; return true; } return false; }
					},
					pass: false,
					run: feedMangle
				},
				lines: {
					list: {
						cidToPhn: function(x) { if ( typeof(x) == 'object' ) { _newData.cidToPhn = x; return true; } return false; },
						companies:function(x) { if ( typeof(x) == 'object' ) { _newData.companies = x; return true; } return false; }
					},
					pass: false,
					run: feedMangle
				},
				users: {
					list: {
						cidToUsr: function(x) { if ( typeof(x) == 'object' ) { _newData.cidToUsr = x; return true; } return false; },
						companies:function(x) { if ( typeof(x) == 'object' ) { _newData.companies = x; return true; } return false; }
					},
					pass: false,
					run: feedMangle
				},
				address: {
					list: {
						addressBook: function(x) { if ( typeof(x) == 'object' ) { _newData.addressBook = x; return true; } return false; },
						md5Hash:     function(x) { if ( typeof(x) == 'object' ) { _newData.md5Hash = x; return true; } return false; }
					},
					pass: false
				},
				roster: {
					list: {
						xmppRoster: function(x) { if ( typeof(x) == 'object' ) { _newData.xmppRoster = x; return true; } return false; }
					},
					pass: false,
					run: parseRoster
				}
		};
		if ( (_tmp = script.match(/^<response result="fail" cmd="(.*?)" data="(.*?)"/)) != null ) {
			if ( _tmp[1] == 'refresh' && (_tmp[2] == 'livefeed' || _tmp[2] == 'roster') )
				flags.parsing[_tmp[2]] = false;
			return;
		} else {
			try {
				_tmp = eval(script);
			} catch(e) {
				flags.parsing = {}; /* NASTY! Hope this never happens! */
				return;
			}
		}
		ORDER:
		for ( var i = 0; i < _order.length; i++ ) {
/* Not currently used - dependency code.
			if ( Array.isArray(_check[_order[i]].required) ) {
				var _required = _check[_order[i]].required;
				for ( var x = 0; x < _required.length; x++ ) {
					if ( ! _check[_required[x]].pass )
						continue ORDER;
				}
			}
*/
			var _list = _check[_order[i]].list;
			/* First check we have everything... */
			for ( var _key in _list ) {
				if ( typeof(_list[_key]) != 'function' || ! _list[_key](_tmp[_key]) )
					continue ORDER;
			}
			/* ...then move it in */
			for ( var _key in _list ) {
				if ( _key == 'userData' ) {  /* Special case to retain permissions where appropriate */
					if ( live[_key].id == _newData[_key].id )
						_newData[_key].perms = live[_key].perms || {};
					else
						_newData[_key].perms = {};
				}
				live[_key] = _newData[_key];
				delete _newData[_key];
				delete _tmp[_key];	/* Don't process twice */
			}
			if ( typeof(_check[_order[i]].run) == 'function' )
				_check[_order[i]].run();
			_check[_order[i]].pass = true;
			flags.parsing[_order[i]] = false;
			if ( _order[i] == 'livefeed' && flags.loading && startPollCalled )
				initAPI();
		}
	}

	/**
	 * Make a request for PABX configuration data to prime the IPCortex.PBX internal data. startPoll() will
	 * normally be used to prime this data.
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function refreshAPI(startpoll) {
		if ( ! flags.parsing.livefeed ) {
			flags.parsing.livefeed = true;
			Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=refresh&data=livefeed', parseAPI);
		}
		if ( ! flags.parsing.roster ) {
			flags.parsing.roster = true;
			Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=refresh&data=roster', parseAPI);
		}
	}

	/**
	 * Make an refresh just a subset of the PABX configuration data to update displayed lines. This will
	 * normally occur automatically.
	 * @memberOf IPCortex.PBX
	 */
	function refreshLines() {
		if ( flags.parsing.lines || flags.parsing.livefeed || flags.loading )
			return;
		flags.parsing.lines = true;
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=refresh&data=lines', parseAPI);
	}

	/**
	 * startPoll callback for setup complete
	 * Called once when polling is started and ready.
	 * Provides no parameters to the callback.
	 * @callback Callback~startPollCB
	 */
	/**
	 * startPoll callback for error condition eg. logged out.
	 * @callback Callback~errorCB
	 * @param {Number} code A code number referencing the error type
	 * @param {String} message An error message
	 */
	/**
	 * Request to initialise the IPCortex.PBX - When complete polling routines are triggered for event updates.
	 * @param {Callback~startPollCB} [callback] Function to be called when initialisation is complete.
	 * @param {Callback~errorCB} [error] Function to be called If an error occurs.
	 * @memberOf IPCortex.PBX
	 */
	function startPoll(callback, error) { return checkReady(callback, error); }
	/** @private */
	function checkReady(callback, error) {
		refreshAPI();
		errorCB = error || errorCB;
		function ready() {
			if ( flags.loading ) {
				if ( startPollCalled )
					setTimeout(ready, 500)
				return;
			}
			if ( typeof(callback) == 'function' )
				callback();
		}
		if ( ! startPollCalled ) {
			startPollCalled = true;
			ready();
		}
	}
	/**
	 * Request to initialise the IPCortex.PBX - Does not start realtime polling as per startPoll().
	 * @param {Callback~startPollCB} [callback] Function to be called when initialisation is complete.
	 * @param {Callback~errorCB} [error] Function to be called If an error occurs.
	 * @memberOf IPCortex.PBX
	 */
	function fetchData(callback, error) {
		refreshAPI();
		errorCB = errorCB || error;
		function ready() {
			if ( flags.loading ) {
				setTimeout(ready, 500)
				return;
			}
			if ( typeof(callback) == 'function' )
				callback();
		}
		ready();
	}

	/**
	 * Polling will eventually stop with an error if the user logs out. This process actively requests that polling stops
	 * and attempts to release the HTTP connection resource.
	 * @memberOf IPCortex.PBX
	 */
	function stopPoll() {
		startPollCalled = null;
		aF.queue = [];
		clearInterval(intervalID);
		intervalID = null;

		function done() {
			aF.cleared = 0; /* Internal override of 60-second limit */
			clearMaxData();
			for ( var x in lookUp.xmpp ) {
				lookUp.xmpp[x].destroy();
				delete lookUp.xmpp[x];
			}
			for ( var x in lookUp.dev ) {
				lookUp.dev[x].destroy();
				delete lookUp.dev[x];
			}
			for ( var x in lookUp.que ) {
				lookUp.que[x].destroy();
				delete lookUp.que[x];
			}
			for ( var x in lookUp.qcall ) {
				lookUp.qcall[x].destroy();
				delete lookUp.qcall[x];
			}
			for ( var x in lookUp.mbx ) {
				lookUp.mbx[x].destroy();
				delete lookUp.mbx[x];
			}
			for ( var x in lookUp.cnt ) {
				lookUp.cnt[x].destroy();
				delete lookUp.cnt[x];
			}
			/* lookUp.room done in disableChat() */
			/* lookup.addr done in flushAddressbook() */
		}
		Utils.httpPost(live.origURI + live.origHost + ':' + live.scriptPort + '/' + ((new Date()).getTime()) + '/', 'closeconnection=1', done, true);
		flags.loading = true;
	}

	/**
	 * Build a device to extension map from loaded initial data in IPCortex.PBX.devToExt
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function deviceToExtension() {
		devToExt = {};
		extToDev = {};
		function _allocPhones(_cid, _ext) {
			var _p = live.cidToPhn[_cid] || [];
			for ( var i = 0; i < _p.length; i++ ) {
				var _h = _p[i];
				var _owned = 0;
				if ( _h.o || _h.d == 'webrtc' + _cid ) _owned++;
				var _ox = (live.cidToUsr[_cid]||{}).x || (live.cidToUsr[_cid]||{}).extension;  /* Owned ext for _cid */
				if ( live.extToCid[_ox + '_' + live.userData.home] )
					_ox += '_' + live.userData.home;
				if ( live.cidToUsr[_cid] && _ox == _ext ) _owned++;
				var _c = live.extToCid[_ext] || {o: false, p: 19, t: '', x: false};

				var _prio = _c.p;
				/* Ext ring_type of A/H/Q treated normally */
				if ( _c.t.search(/[XIFCVPOo]/) != -1 )
					continue;
				if ( _c.t == 'T' )
					_prio = 19;
				if ( _h.l == 'hotdesk' )
					_prio = 39 + _owned;
				if ( _h.l == 'fork' || _h.l == 'deflect' )
					_prio = 19;
				/* Create a key that defines the sort order for allocation */
				_alloc.push({	key: _h.m + '' + _prio + _c.p + _ext + _owned,
					ext: _c,
					phn: _h,
					l: _h.l,
					o: _owned,
					x: _ox == _ext,
					c: _cid,
					p: _prio - 20 });
			}

		}

		/* Calculate order of allocation for all extensions */
		var _alloc = [];
		for ( var _ext in live.extToCid ) {
			var _l = live.extToCid[_ext].l;
			for ( var j = 0; j < _l.length; j++ ) {
				var _cid = _l[j].i;
				_allocPhones(_cid, _ext);
			}
		}
		if ( live.cidToPhn[0] )
			_allocPhones(0, 0);
		_alloc.sort(function(a, b) { return 'x'+a.key > 'x'+b.key ? 1 : ('x'+a.key < 'x'+b.key ? -1 : 0); });

		/* FIRST: Allocate extensions as if we have infinite numbers of lines. */
		var _d2e = {};
		var _allocDone = {};
		while ( _alloc.length ) {
			var _a = _alloc.shift();
			var _h = _a.phn.d;
			if ( _allocDone[_a.ext.e + ',' + _h] )
				continue;
			if ( _d2e[_h] == null )
				_d2e[_h] = [{p:_a.phn, l:[]}];

			if ( ! _a.c )		/* Orphan phones need no more processing */
				continue;

			if ( _a.o == 2 || _a.l == 'hotdesk' ) {		/* Items that get put onto line 1, owner/hotdesk */
				_d2e[_h][0].e = _a.ext.e;
				_d2e[_h][0].n = _a.ext.n;
				_d2e[_h][0].i = _a.l == 'hotdesk' ? 'H' : 1;
				_d2e[_h][0].l.unshift({	e: _a.ext.e,
					n: _a.ext.n,
					t: _a.ext.t,
					o: _a.x,
					p: _a.phn.o,
					l: _a.phn.l
				});
			} else if ( _a.p == -1 ) {			/* Items that just call line 1, fwd/deflect/unassigned */
				_d2e[_h][0].l.push({	e: _a.ext.e,
					n: _a.ext.n,
					t: _a.ext.t,
					o: _a.x,
					p: _a.phn.o,
					l: _a.phn.l
				});
			} else {					/* Other line users. */
				var _o = {	e: _a.ext.e,
						n: _a.ext.n,
						l: [{	e: _a.ext.e,
							n: _a.ext.n,
							t: _a.ext.t,
							o: _a.x,
							p: _a.phn.o,
							l: _a.phn.l
						}]
				};
				_d2e[_h].push(_o);
			}
			_allocDone[_a.ext.e + ',' + _h] = true;
		}
		for ( var _h in _d2e ) {
			/* SECOND: Shift-up or placeholder devices with line 1 unused. */
			if ( _d2e[_h][0].i == null ) {
				if ( _d2e[_h][0].p.h ) { /* Hotdesk placeholder */
					_d2e[_h][0].e = (Utils.isEmpty(live.hdCID) ? 'Hotdesk' : live.hdCID);
					_d2e[_h][0].n = 'Hotdesk';
					_d2e[_h][0].i = 1;
					_d2e[_h][0].h = true;
				} else {		/* Shift lines up */
					if ( _d2e[_h][1] == null )
						_d2e[_h][1] = {l:[]}
					_d2e[_h][1].p = _d2e[_h][0].p;
					_d2e[_h][1].l = _d2e[_h][0].l.concat(_d2e[_h][1].l);
					_d2e[_h].shift();
				}
			}
			/* THIRD: Roll any overflow lines into the last "Various" line. */
			var _lines = _d2e[_h][0].p.n || 1;
			while ( _d2e[_h].length > _lines ) {
				if ( _lines > 1 ) {
					_d2e[_h][_lines - 1].n = 'Various';
					_d2e[_h][_lines - 1].e = _d2e[_h][_lines - 1].l[0].e;
				}
				_d2e[_h][_lines - 1].l = _d2e[_h][_lines - 1].l.concat(_d2e[_h][_lines].l);
				_d2e[_h].splice(_lines, 1);
			}
			/* FOURTH: Fill "Spare" lines */
			if ( ! _d2e[_h][0].e && ! _d2e[_h][0].n ) {
				_d2e[_h][0].e = 'Spare';
				_d2e[_h][0].n = 'Spare';
			}
			while ( _d2e[_h].length < _lines ) {
				_d2e[_h].push({ e: _d2e[_h][0].e, n: 'Spare', l: [] });
			}

			/* FIFTH: Move the result into devToExt and extToDev */
			delete _d2e[_h][0].p;
			for ( var i = 0; i < _lines; i++ ) {
				var _l = 'SIP/' + _h;
				if ( i ) _l += '_' + (i + 1);
				devToExt[_l] = _d2e[_h][i];
				devToExt[_l].i = devToExt[_l].i || (i + 1);
				if ( live.extToCid[_d2e[_h][i].e] ) {
					extToDev[_d2e[_h][i].e] = extToDev[_d2e[_h][i].e] || [];
					extToDev[_d2e[_h][i].e].push(_l);
				}
			}
			delete _d2e[_h];
		}
	}

	/**
	 * Returns a list of DDI's accociated with an extension.
	 * @param {String} ext Extension number
	 * @return {String[]} List of DDI numbers
	 * @memberOf IPCortex.PBX
	 */
	function listDDIByExtension(ext) {
		if ( ! (Array.isArray(live.extToDDI[ext])) )
			return [];
		var _list = [];
		for ( var i = 0; i < live.extToDDI[ext].length; i++ )
			_list.push(devToExt[dev][i].c + '' + devToExt[dev][i].n);
		return _list;
	}

	/**
	 * Returns a list of Extensions associated with a (SIP) device/registration.
	 * @param {String} dev Device name
	 * @return {String[]} List of Extension numbers
	 * @memberOf IPCortex.PBX
	 */
	function listExtensionByDevice(dev) {
		if ( typeof(devToExt[dev]) != 'object' || ! (Array.isArray(devToExt[dev].l)) )
			return [];
		var _list = [];
		for ( var i = 0; i < devToExt[dev].l.length; i++ )
			_list.push(devToExt[dev].l[i].e);
		return _list;
	}

	/**
	 * Structure describing an extension
	 * @typedef {Object} IPCortex.PBX~compactExtension
	 * @property {String} e Primary extension number
	 * @property {String} n Primary name
	 * @property {Number|String} i Line number 1 or higher, 'H' for hotdesk
	 * @property {Bool} h true: is a hotdesk line
	 * @property {Array.<IPCortex.PBX~detailExtension>} l Ordered list of all extensions calling the device
	 * @private
	 */
	/**
	 * Structure describing an extension
	 * @typedef {Object} IPCortex.PBX~detailExtension
	 * @property {String} e Extension number
	 * @property {String} n Extension name
	 * @property {String} t Extension type (Single letter)
	 * @property {Bool} o Extension is owned in this context
	 * @property {Bool} p Phone is owned in this context
	 * @property {String} l Link type (link|fork|deflect|hotdesk)
	 * @private
	 */
	/**
	 * Returns List of Extensions and metadata accociated with a (SIP) device/registration.
	 * @param {String} dev Device name
	 * @return {IPCortex.PBX~compactExtension} Details of extension(s) calling the device.
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function _getExtensionByDevice(dev) {
		if ( typeof(devToExt[dev]) != 'object' )
			return {};
		return devToExt[dev];
	}

	/**
	 * Returns a list of ContactIDs accociated with an extension.
	 * 
	 * Contact ID is a unique identifier per user on the PABX. It can be retrieved
	 * for the logged-in user using IPCortex.PBX.Auth.getUserInfo.
	 * 
	 * @param {String} ext Extension number
	 * @return {String[]} List of ContactIDs
	 * @memberOf IPCortex.PBX
	 */
	function listCIDByExtension(ext) {
		if ( ! (Array.isArray(live.extToCid[ext].l)) )
			return [];
		var _list = [];
		for ( var i = 0; i < live.extToCid[ext].l.length; i++ )
			_list.push(live.extToCid[ext].l[i].i);
		return _list;
	}

	/**
	 * 
	 * Return array of mac+port strings for contact_id. mac is the MAC address
	 * of the device and port is usually '0', but increments for multi-port
	 * devices such as ATAs
	 *
	 * @param {Number} cid Contact ID of user
	 * @param {Bool} owned If 'true' return only owned or Hotdesk device
	 * 
	 * If false returns all devices associated with the user
	 * 
	 * @return {String[]} List of MAC+Ports
	 * @memberOf IPCortex.PBX
	 */
	function listMACByCID(cid, owned) {
		if ( ! (Array.isArray(live.cidToPhn[cid])) )
			return [];
		var _list = []
		for ( var i = 0; i < live.cidToPhn[cid].length; i++ ) {
			if ( ! owned || live.cidToPhn[cid][i].o || live.cidToPhn[cid][i].l == 'hotdesk' || live.cidToPhn[cid][i].d == 'webrtc' + cid )
				_list.push(live.cidToPhn[cid][i].m + '' + live.cidToPhn[cid][i].p);
		}
		return _list;
	}

	/**
	 * Returns a list of all extensions.
	 * @param {String} [type] The type of extension to return
	 * __null__: (default) All extensions
	 * __A__: Ring-all extensions
	 * __H__: Hunt extensions
	 * __Q__: Queue extensions
	 * __I__: IVR extensions
	 * __F__: Fax extensions
	 * __C__: Conference extensions
	 * __V__: Voicemail extensions
	 * __P__: External Voicemail extensions
	 * @return {String[]} List of extensions
	 * @memberOf IPCortex.PBX
	 */
	function listExtension(type) {
		if( type != null && type.search(/^[AHQIFCVP]$/) == -1 )
			return [];
		if ( typeof(extByExt) != 'object' )
			return [];
		var _list = []
		for ( var i in extByExt ) {
			if( type == null || extByExt[i].type == type )
				_list.push(i);
		}
		_list.sort();
		return _list;
	}

	/**
	 * Structure describing an extension
	 * @typedef {Object} IPCortex.PBX~Extension
	 * @property {String} company Extension company.
	 * @property {String} name Extension name e.g. Support.
	 * @property {Number|Bool} owner Owner contact ID or false.
	 * @property {String} priority Priority for line allocation (Has 20 added)
	 * @property {String} type A: Ring all, H: Hunt dial, etc
	 * @property {String} voicemail Voicemail box.
	 */
	/**
	 * Fetch either an Object containing extension objects keyed on extension if ext is null
	 * or a specific extension object.
	 * @param {String} [ext] Optonal extension number to get
	 * @param {Bool} [clone] if true, return copies of objects, not refs.
	 * @return {Object.<String, IPCortex.PBX~Extension>}|{IPCortex.PBX~Extension} Extension or list of extensions
	 * @memberOf IPCortex.PBX
	 */
	function getExtension(ext, clone) {
		return getInfo('extension', ext, clone);
	}

	/**
	 * Structure describing a user
	 * @typedef {Object} IPCortex.PBX~User
	 * @property {Number} cid Contact ID
	 * @property {String} email Email address
	 * @property {String} [extension] Owned extension.
	 * @property {String} name User name.
	 * @property {String} [phone] MAC of owned phone.
	 * @property {String} [port] Port of owned phone.
	 * @property {String} uname Unique name (login name) 
	 */
	// Think these are possibly part of it???
	// * @property {String} xmpp Xmpp device.
	// * @property {Api.call} call A call object for doing things to this contact (eg. contact.transfer(call), contact.hook(cb))
	/**
	 * Fetch either an Object containing user objects keyed on contact ID if cid is null
	 * or a specific user object.
	 * @param {Number} [cid] Optonal contact ID to get
	 * @param {Bool} [clone] if true, return copies of objects, not refs.
	 * @return {Object.<Number, IPCortex.PBX~User>|IPCortex.PBX~User} User or list of users
	 * @memberOf IPCortex.PBX
	 */
	function getUser(cid, clone) {
		return getInfo('user', cid, clone);
	}

	/**
	 * Structure describing a phone. A phone is a top level thing that is made up of Lines/Devices.
	 * @typedef {Object} IPCortex.PBX~Phone
	 * @property {String[]} devices Array of devices.
	 * @property {String} name Device name.
	 * @property {String} features eg. 'answer,hold,talk'
	 * @property {String|Bool} owner Owner contact ID or false.
	 * @property {String} port Device port (redundant really)
	 * @property {String} type Link type: link, hotdesk, fork, deflect. (meaningless, is one of many possible links)
	 */
	/**
	 * Fetch either an Object containing phone objects keyed on MAC+Port if mac is null
	 * or a specific phone object.
	 * @param {String} [mac] Optonal MAC+Port to get
	 * @param {Bool} [clone] if true, return copies of objects, not refs.
	 * @return {Object.<String, IPCortex.PBX~Phone>|IPCortex.PBX~Phone} Phone or list of phones
	 * @memberOf IPCortex.PBX
	 */
	function getPhone(mac, clone) {
		return getInfo('phone', mac, clone);
	}

	/**
	 * Structure describing a device Hook's creation.
	 * Object keyed on Device containing an array of matching device filter objects
	 * @typedef {Object.<Device, Object[]>} IPCortex.PBX~HookInfo
	 * @property {String} extension Extension number for this filter
	 * @property {String} cid Contact ID for this filter
	 * @property {String} phone MAC+Port for this filter
	 * @property {String} device Device name for this filter
	 */
	/**
	 * Fetch either an Object containing HID Info (Hook ID based info) objects keyed on HID if hid is null,
	 * otherwise returns a specific HID Info object.
	 * @param {String} [hid] Optonal HID to get
	 * @param {Bool} [clone] if true, return copies of objects, not refs.
	 * @return {Object} Object or Object-of-objects
	 * @memberOf IPCortex.PBX
	 */
	function getHIDInfo(hid, clone) {
		return getInfo('hid', hid, clone);
	}

	/**
	 * Wrapper to allow fetching and possibly cloning of internal data
	 * @param {String} type One of 'extension', 'phone', 'user' or 'hid' for type of data to return
	 * @param {String} [key] Specific item to return or null for all.
	 * @param {Bool} [clone] If 'true' clone the returned data
	 * @return {Object[]|Object|Bool} Object, list of objects or 'false' for an empty result.
	 * @memberOf IPCortex.PBX
	 * @private
	 */ 
	function getInfo(type, key, clone) {
		var _result = {};
		var _typeLookup = {
			hid:		hidStruct,
			user:		live.cidToUsr,
			phone:		macToPhn,
			extension:	extByExt
		};
		if ( ! _typeLookup[type] )
			return false;
		var _tmp = _typeLookup[type];
		if ( key )
			_tmp = _typeLookup[type][key];
		if ( clone )
			Utils.doClone(_tmp, _result);
		else
			_result = _tmp;
		if ( ! Utils.isEmpty(_tmp) )
			return _result;
		return false; 
	}

	/**
	 * Addressbook callback. This will be called once per new, changed or deleted addressbook
	 * entry. This callback will be cached and re-used for future updates.
	 * @callback Callback~addressbookCB
	 * @param {IPCortex.PBX.address[]} address A list of address book entry/instances. If called repeatedly, 
	 * this parameter contains a list of new or updated entries
	 * @param {String[]} deleted A list of addressbook entry keys that have been deleted since the last call.
	 */
	/**
	 * Addressbook finished callback
	 * @callback Callback~addressbookFinish
	 */
	/**
	 * Request an addressbook, supplies a callback function which is called 
	 * when data is ready. The callback will be called with updates if an addresbook refresh occurs.
	 * 
	 * address.compare(otheraddress) returns a boolean and can be used to compare 2 entries
	 * for equality to determine how the list has changed.
	 * 
	 * @param {Callback~addressbookCB} callback Called once per address entry
	 * @memberOf IPCortex.PBX
	 * @todo Activate the "delete" addressbook callback.
	 */
	function getAddressbook(callback) {
		/* Retrieve cached callback functions if not provided */
		var callback = callbacks.getAddressbook = callback || callbacks.getAddressbook;

		if ( flags.parsing.address || flags.parsing.users || typeof(callback) != 'function' )
			return;
		flags.parsing.address = flags.parsing.users = true;
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=refresh&data=users', parseAPI);
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=refresh&data=address', parseAPI);
		_addressReady();
	}
	/** @private */
	function _addressReady() {
		if ( flags.parsing.address || flags.parsing.roster || flags.parsing.users ) {
			setTimeout(_addressReady, 100)
			return;
		}
		callback = callbacks.getAddressbook;
		/* First do actual addressbook entries */
		var _newList = {};
		var _res = [];
		for ( var _group in live.addressBook ) {
			for ( var b = 0; b < live.addressBook[_group].length; b++ ) {
				var _tmp = address.create(_group, live.addressBook[_group][b]);
				var _key = _tmp.get('key');
				_newList[_key] = true;
				if ( lookUp.addr[_key] == null || ! _tmp.compare(lookUp.addr[_key]) ) {
					if( lookUp.addr[_key] ) {
						lookUp.addr[_key].merge(_tmp);
						_tmp.destroy();
					} else
						lookUp.addr[_key] = _tmp;
					_res.push(lookUp.addr[_key])	/* New or changed */
				}
			}
		}
		/* First do actual addressbook entries */
		/* TODO: Allow XMPP addresses to be tagged against above entries for de-dupe */
		if ( ! (Array.isArray(flags.refreshData)) )
			flags.refreshData = [];
		for ( var _key in live.xmppRoster ) {
			var _x = live.xmppRoster[_key];
			if ( _x.d.search(/^.+@.+$/) == -1 || _x.f == 0 )
				continue;
			var _tmp = address.create('personal', {d: 'Custom/' + _x.d, n: _x.n || _x.d});
			var _key = _tmp.get('key');
			_newList[_key] = true;
			if ( _x.f & 1 )
				flags.refreshData.push('Custom/' + _x.d);       /* Ensure we have latest XMPP state */
			if ( lookUp.addr[_key] == null || ! _tmp.compare(lookUp.addr[_key]) ) {
				if( lookUp.addr[_key] ) {
					lookUp.addr[_key].merge(_tmp);
					_tmp.destroy();
				} else
					lookUp.addr[_key] = _tmp;
				_res.push(lookUp.addr[_key])	/* New or changed */
			}
		}
		/* Call clear remaining hooks and delete on anything that has vanished */
		var _old = [];
		for ( var x in lookUp.addr ) {
			if ( ! _newList[x] ) {
				lookUp.addr[x].destroy();    /* This should auto-protect any referenced subclasses */
				delete lookUp.addr[x];
				_old.push(x);
			}
		}
		if ( typeof callback == 'function' )
			callback(_res, _old);
		_newList = _res = _old = null;
	}

	/**
	 * Clear addressbook state, eg. as part of a logout.
	 */
	function flushAddressbook() {
		callbacks.getAddressbook = null;

		for ( var x in lookUp.addr ) {
			lookUp.addr[x].destroy();
			delete lookUp.addr[x];
		}
	}

	/**
	 * Lines callback. This callback will be cached, and called with an updated
	 * array if a hotdesk event changes the list of lines.
	 * @callback Callback~linesCB
	 * @param {Array.<IPCortex.PBX.device>} lines Array of Line (device) objects
	 */
	/**
	 * Requests a list of all lines (devices), and takes a callback function which is invoked 
	 * when data is ready. 
	 * 
	 * The callback will be called with updates if hotdesk events change the result set.
	 * device.compare(otherdev) can be used to either sort or compare lines to determine how
	 * the list has changed.
	 * 
	 * Fetch list of all (or owned) called devices for current user.
	 * @param {Callback~linesCB} callback
	 * @param {Bool} [owned] If true, only return lines for owned device
	 * 
	 * Setting owned falsed will hook __all__ lines associated with the current user. This is
	 * potentially large. 
	 * 
	 * Setting owned to true lists only lines for the user's owned phone
	 * and a hotdesk line of there is one.
	 *
	 * @todo This function makes no effort to refresh live data. This may be the right behaviour.
	 * @memberOf IPCortex.PBX
	 */
	function getLines(callback, owned) {
		/* Retrieve cached callback function if not provided */
        console.log('api::getLines()');
		if ( callback == null ) {
			callback = callbacks.getLines;
			owned = callbacks.getLinesOwned;
		} else {
			callbacks.getLines = callback;
			callbacks.getLinesOwned = owned;
		}

		if ( typeof(callback) != 'function' || isNaN(live.userData.id) || flags.loading )
			return;
		var _lines = [];
		var _phoneList = listMACByCID(live.userData.id, owned);
		for ( var p = 0; p < _phoneList.length; p++ ) {
			var _deviceList = getPhone(_phoneList[p]).devices;
			for ( var d = 0; d < _deviceList.length; d++ ) {
				if ( ! lookUp.dev[_deviceList[d]] )
					continue;
				if ( owned && ! haveJsSIP() && lookUp.dev[_deviceList[d]].get('webrtc') )
					continue;
				if ( owned && d > 0 && macToPhn[_phoneList[p]].owner != live.userData.id ) /* WebRTC device? */
					break;
				_lines.push(lookUp.dev[_deviceList[d]]);
			}
		}
		_lines.sort(function(a,b){return a.compare(b);});
		function initialCB() {
			callback(_lines);
		}
		setTimeout(initialCB, 1);
	}

	/**
	 * Roster update callback. This callback is cached, and may be called if roster
	 * updates occur internally.
	 * @callback Callback~rosterCB
	 * @todo This should proabbly return the requested data.
	 */
	/**
	 * Request a refresh of the XMPP roster for current user. No data returned, but
	 * global datastore is refreshed.
	 * @param {Callback~rosterCD} [callback] Called when the update is complete.
	 *
	 * @todo Probably be nice if this did return a clone of the data to "userspace"
	 * @memberOf IPCortex.PBX
	 */
	function getRoster(callback) {
		/* Retrieve cached callback functions if not provided */
		callback = callbacks.getRoster = callback || callbacks.getRoster;

		if ( flags.parsing.roster )
			return;
		function ready() {
			if ( flags.parsing.roster ) {
				setTimeout(ready, 500)
				return;
			}
			if ( typeof(callback) == 'function' )
				callback(live.xmppRoster);
		}
		flags.parsing.roster = true;
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=refresh&data=roster', parseAPI);
		if ( typeof(callback) == 'function' )
			ready();
	}

	/**
	 * Create a new addressbook entry in an OCM reserved dataset.
	 * 
	 * If initialised, the addressbook refresh callback will be used to refresh the
	 * client with any resultant updates.
	 *
	 * @param {String} name Contact name
	 * @param {String} number Contact number
	 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
	 * @memberOf IPCortex.PBX
	 */
	function createAddress(name, number, callback) {
		function parseResult(content) {
			if ( ! typeof content == 'string' || content.search(/<response.*result="success"/) != -1 ) {
				if ( callback && typeof callback == 'function' )
					callback(true, content);
				getAddressbook();
			} else if ( callback && typeof callback == 'function' )
				callback(false, content);
		}
		name = name || '';
		number = number || '';
		if ( number.length == 0 && name.length == 0 )
			return PBXError.ADDR_MISSING_NUMNAME;
		if ( number.length == 0 )
			return PBXError.ADDR_MISSING_NUM;
		if ( name.length == 0 )
			return PBXError.ADDR_MISSING_NAME;
		number = number.replace(/ /g, '');
		if ( number.search(/[^0-9\#\*]/) != -1 )
			return PBXError.ADDR_ILLEGAL_NUM;
		if ( name.search(/[^a-zA-Z0-9\.\s\,\'\/\\\-_]/) != -1 )
			return PBXError.ADDR_ILLEGAL_NAME;
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=create&type=address&name=' + name + '&number=' + number , parseResult);
		return PBXError.OK;
	}

	/**
	 * Create a new XMPP entry and request access.
	 * 
	 * If initialised, the addressbook refresh callback will be used to refresh the
	 * client with any resultant updates.
	 *
	 * @param {String} name Contact name or nickname
	 * @param {String} xmppid Contact XMPP-ID
	 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
	 * @memberOf IPCortex.PBX
	 */
	function createXmpp(name, xmppid, callback) {
		function parseResult(content) {
			if ( ! typeof content == 'string' || content.search(/<response.*result="success"/) != -1 ) {
				if ( callback && typeof callback == 'function' )
					callback(true, content);
				getAddressbook();
			} else if ( callback && typeof callback == 'function' )
				callback(false, content);
		}
		name = name || '';
		xmppid = xmppid || '';
		xmppid = xmppid.replace(/ /g, '');
		if ( xmppid.length == 0 && name.length == 0 )
			return PBXError.ADDR_MISSING_XMPPNAM;
		if ( xmppid.length == 0 )
			return PBXError.ADDR_MISSING_XMPP;
		if ( name.length == 0 )
			return PBXError.ADDR_MISSING_NAME;
		if ( xmppid.search(/^[a-zA-Z0-9!#\$%&\'\*\+\-_`\{\}\|~\.]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9]+)+$/) == -1 )
			return PBXError.ADDR_ILLEGAL_XMPP;
		if ( name.search(/[^a-zA-Z0-9\.\s\,\'\/\\\-_]/) != -1 )
			return PBXError.ADDR_ILLEGAL_NAME;
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=connectext&name=' + name + '&jid=' + xmppid , parseResult);
		return PBXError.OK;
	}

	/**
	 * History callback. This callback is cached, and is called for all subsequent
	 * history events. When called initially, any existing history will be announced via this
	 * callback.
	 * @callback Callback~historyCB
	 * @param {IPCortex.PBX.history} history History object representing an ended call
	 * @param {Bool} saved true: This is a saved history item, false: this is a new history item.
	 */
	/**
	 * Enable history subsystem. Immediately calls back with all existing history, and whenever a call ends.
	 * @param {Callback~historyCB} callback Called for each history item received.
	 * @return {Bool} false If the callback is missing or history is already enabled.
	 * @memberOf IPCortex.PBX
	 */
	function enableHistory(callback) {
		if ( hI.enabled )
			return false;
		if ( typeof(callback) != 'function' )
			return false;
		hI.enabled = 1;
		hI.cb = callback;
		if ( ! loadCache.rawhistory ) {
			loadData('rawhistory', parseHistory);
			hI.saved = (new Date()).getTime();
		}
		saveHistory();
		return true;
	}

	/**
	 * Parse and act on a response from a call to api.whtm for history. Called by
	 * parseAPI() which does most of the work.
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function parseHistory(type, str) {
		if ( ! hI.enabled || type != 'rawhistory' )
			return;
		_history = JSON.parse(str);
		if ( ! (Array.isArray(_history)) )
			_history = [];
		for ( var i = 0; i < _history.length; i++ ) {
			var _record = {};
			for ( var x = 0; x < translate.length; x++ ) {
				if ( _history[i][translate[x].s] )
					_record[translate[x].a] = _history[i][translate[x].s];
				else if ( _history[i][translate[x].a] )
					_record[translate[x].a] = _history[i][translate[x].a];
			}
			if ( lookUp.dev[_record.device] && ! history.is_dupe(_record) ) {
				if ( lookUp.dev[_record.device].get('history') ) {
					try {
						history.create(_record);
					} catch(e) {};
				} else {
					if ( ! hI.cache[_record.device] )
						hI.cache[_record.device] = [_record];
					else
						hI.cache[_record.device].push(_record);
				}
			}
		}
	}

	/**
	 * Save history. History is saved occasionally, this forces a save (eg. before exit).
	 * It may not be called unless history is enabled.
	 * @todo Probably ought to write this and export it
	 * @memberOf IPCortex.PBX
	 */
	function _getHistory() {
		if ( ! loadCache.rawhistory || ! hI.enabled )
			return false;
		var _histData = [];
		/* Sort and trim to 100 records */
		hI.history.sort(function(a,b){ return a.attr.end < b.attr.end ? -1 : (a.attr.end > b.attr.end ? 1 : 0); });
		while ( hI.history.length > 50 )
			hI.history.shift().destroy();
		for ( var i = 0; i < hI.history.length; i++ ) {
			var _record = {};
			for ( var x = 0; x < translate.length; x++ )
				_record[translate[x].s] = (hI.history[i].get(translate[x].a) || '')
			_histData.push(_record);
		}
		return base64encode(JSON.stringify(_histData));
	}

	/**
	 * Save history. History is saved occasionally, this forces a save (eg. before exit).
	 * It may not be called unless history is enabled.
	 * @todo Probably ought to write this and export it
	 * @memberOf IPCortex.PBX
	 */
	function saveHistory() {
		function save() {
			if ( hI.timeout )
				clearTimeout(hI.timeout);
			Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=save&type=history&data=' + _getHistory());
			hI.saved = (new Date()).getTime();
			hI.timeout = null;
		}
		if ( ! loadCache.rawhistory || ! hI.enabled )
			return false;
		if ( hI.updated <= hI.saved ) {
			hI.saved = (new Date()).getTime();
			return true;	
		}
		if ( hI.timeout )
			return true;
		if ( ((new Date()).getTime() - hI.saved) < 30000 )	/* High load operation. allowed every 30 seconds max */
			hI.timeout = setTimeout(save, 31000);
		else
			save();
		return true;
	}

	/**
	 * Disable history subsystem. History is flushed an no further callbacks are possible.
	 * @todo Probably ought to write this and export it
	 * @memberOf IPCortex.PBX
	 */
	function disableHistory() {
		if ( hI.timeout )
			clearTimeout(hI.timeout);
		while ( hI.history.length )
			hI.history.shift().destroy();
		hI = {
			enabled:	0,
			timeout:	null,
			saved:		(new Date()).getTime(),
			updated:	(new Date()).getTime(),
			cb:		null,
			cache:		{},
			devices:	{},
			history:	[]
		};
		loadCache.rawhistory = null;
		return true;
	}

	/**
	 * Parse and act on a response from a call to api.whtm for roster. Called by
	 * parseAPI() which does most of the work.
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function parseRoster() {
		if ( live.xmppRoster && live.xmppRoster.seq != null ) {
			counters.xmppSequence = live.xmppRoster.seq;
			delete live.xmppRoster.seq;
		}
		if ( ! (Array.isArray(flags.refreshData)) )
			flags.refreshData = [];
		for ( var i in live.xmppRoster ) {
			/* All of the changes to Roster since the last update need a maxdata = 0 fetch
			 * that is hard, so do whole roster. */
			flags.refreshData.push('Custom/' + live.xmppRoster[i].d);
		}
	}

	/**
	 * Chat room callback. This callback is cached, and is called for all subsequent
	 * chat events. When called initially, any existing rooms will be announced via this
	 * callback.
	 * @callback Callback~chatCB
	 * @param {IPCortex.PBX.room} room Room object for room that has been created, or updated.
	 */
	/**
	 * Presence callback. This callback is cached, and is called for all subsequent
	 * presence updates events. When called initially, any existing presence data will be announced via this
	 * callback.
	 * @callback Callback~chatCB
	 * @param {IPCortex.PBX.room} room Room object for room that has been created, or updated.
	 */
	/**
	 * Enable chat subsystem. Logs user on to chat. Immediately calls back with all existing rooms, and whenever a new room appears.
	 * @param {Callback~chatCB} roomCB Called for each chat event received.
	 * @param {Callback~presenceCB} presenceCB Called for each chat event received.
	 * @return {Bool} false if the callback is missing.
	 * @memberOf IPCortex.PBX
	 */
	function enableChat(roomCB, presenceCB) {
		if ( typeof(roomCB) != 'function' )
			return false;
		cH.enabled = 1;
		cH.initial = 1;		/* We clear this once we're up and running */
		cH.roomCB = roomCB || cH.roomCB;
		cH.presenceCB = presenceCB || cH.presenceCB;
		while ( cH.rooms.length )
			roomCB(cH.rooms.pop(), cH.initial == 1);
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
				'cmd=create&type=room' +
				'&name=_' + live.userData.id + '_' +
				'&id=' + live.userData.id + 
				'&autoclean=5');
		cH.hookid = hookContact(live.userData.id, function() {}); /* Hook self to be sure presence updates happen */
		setStatus('online');
		return true;
	}

	/**
	 * Disable chat subsystem. No further callbacks will occur. User will be indicated as logged-off.
	 * @memberOf IPCortex.PBX
	 */
	function disableChat(callback) {
		if ( ! cH.enabled )
			return true;
		cH.enabled = 0;
		cH.initial = 0;
		setStatus('offline');
		if ( cH.online )
			cH.online.leave();
		unHook(cH.hookid);
		var params = '';
		for ( var _r in lookUp.room ) {
			if ( cH.online === lookUp.room[_r] )
				continue;
			params += '&key=' + lookUp.room[_r].attr.key + '&roomID=' + lookUp.room[_r].attr.roomID;
			lookUp.room[_r].destroy();
			delete lookUp.room[_r];
		}
		if ( params.length )
			Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=unjoin' + params);
		cH.online = null;
		cH.hookid = null;
		cH.roomCB = null;
		return true;
	}

	/**
	 * Set chat status
	 * @param {String} show (online|away|xa|dnd)
	 * @param {String} status Free text status description
	 * @memberOf IPCortex.PBX
	 */
	function setStatus(show, status) {
		if ( cH.xmpp )
			cH.xmpp.setStatus(show, status);
	} 

	function base64decode(base64) {
		var i = 0;
		var str = '';
		var chr1, chr2, chr3 = '';
		var enc1, enc2, enc3, enc4 = '';
		base64 = base64.replace(/[^A-Za-z0-9\+\/\=]/g, '');
		var b64array = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		do {
			enc1 = b64array.indexOf(base64.charAt(i++));
			enc2 = b64array.indexOf(base64.charAt(i++));
			enc3 = b64array.indexOf(base64.charAt(i++));
			enc4 = b64array.indexOf(base64.charAt(i++));

			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;

			str = str + String.fromCharCode(chr1);
			if ( enc3 != 64 )
				str = str + String.fromCharCode(chr2);
			if ( enc4 != 64 )
				str = str + String.fromCharCode(chr3);

			chr1 = chr2 = chr3 = '';
			enc1 = enc2 = enc3 = enc4 = '';
		} while ( i < base64.length );

		return str;
	}

	function base64encode(str) {
		var i = 0;
		var base64 = '';
		var chr1, chr2, chr3 = '';
		var enc1, enc2, enc3, enc4 = '';
		var b64array = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
		do {
			chr1 = str.charCodeAt(i++);
			chr2 = str.charCodeAt(i++);
			chr3 = str.charCodeAt(i++);

			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;

			if ( isNaN(chr2) )
				enc3 = enc4 = 64;
			else if ( isNaN(chr3) )
				enc4 = 64;

			base64 += b64array.charAt(enc1) +
				b64array.charAt(enc2) +
				b64array.charAt(enc3) +
				b64array.charAt(enc4);
			chr1 = chr2 = chr3 = '';
			enc1 = enc2 = enc3 = enc4 = '';
		} while ( i < str.length );

		return base64;
	}

	function randomString(length) {
		var _string = '';
		while((_string += parseInt(Math.random()*1000000000).toString(36)).length < length);
  		return _string.slice(0, length);
	}

	/**
	 * Callback from a data load.
	 * @callback Callback~loadCB
	 * @param {String} type Type of data requested (qpoll|qsent|qhide|qview|ocm1flags|ocm1config|ocm2config|history)
	 * @param {String} data The raw data.
	 */
	/**
	 * Load contact data of selected type for the logged-in user.
	 * @param {String} type (qpoll|qsent|qhide|qview|ocm1flags|ocm1config|ocm2config|rawhistory)
	 * @param {Callback~loadCB} callback Will be called with type and raw data.
	 * @memberOf IPCortex.PBX
	 */
	function loadData(type, callback) {
		function decode(xml) {
			var _s = xml.split('\n');
			if ( _s[0] != '<response result="success">' && _s[1] != '<data name="' + type + '">' )
				callback(type, null);
			var _string = base64decode(_s[2]);
			loadCache[type] = _string;
			callback(type, _string);
		}
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=load&type=' + type, decode);
	}

	/**
	 * Save contact data of selected type for the logged-in user.
	 * @param {String} type (qpoll|qsent|qhide|qview|ocm1flags|ocm1config|ocm2config|rawhistory|ocmversion)
	 * @param {String} data data to be saved
	 * @memberOf IPCortex.PBX
	 */
	function saveData(type, data) {
		if ( typeof data == 'number' )
			data = new String(data);
		else if ( typeof data == 'object' )
			data = JSON.stringify(data);
		if ( loadCache[type] == data )
			return;

		function updateCache(content) {
			if ( ! typeof content == 'string' )
				return;
			if ( content.search(/<response.*result="success"/) != -1 )
				loadCache[type] = data;
		}
		var _base64 = base64encode(data);
		Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=save&type=' + type + '&data=' + _base64, updateCache);
	}

	/**
	 * Callback from a device hook. Device callbacks are cached on a per-hook basis.
	 * @callback Callback~deviceCB
	 * @param {Object} filter The filter that was used for this hook
	 * @param {Number} hid The hook ID of the hook that is firing
	 * @param {IPCortex.PBX.device} device The device instance that has a state change
	 */
	/**
	 * Hook a device or devices based on search criteria
	 * @param {String[]} [extensions] List of extensions to include in the hook
	 * @param {Number[]} [cids] List of contact IDs to include in the hook
	 * @param {String[]} [phones] List of phones to include in the hook
	 * @param {String[]} [devices] List of devices to include in the hook
	 * @param {Bool} [owned] Only include owned devices in the hook. Also includes whole owned phones.
	 * @param {Callback~deviceCB} callback Called for each device event received.
	 * @return {Number} Hook ID that identifies this hook request, or error code (< 0).
	 * @memberOf IPCortex.PBX
	 */
	function hookDevice(extensions, cids, phones, devices, owned, callback) {
		if ( cids ) cids = [].concat(cids);
		if ( phones ) phones = [].concat(phones);
		if ( devices ) devices = [].concat(devices);
		if ( extensions ) extensions = [].concat(extensions);
		if ( typeof(callback) != 'function' )
			return PBXError.HOOK_BAD_CALLBACK;
		var _filter = {};
		var _struct = {};
		var _deviceUsed = {};
		var _deviceSpare = {};
		var _extensions = getExtension();
		function buildFilter(filter) {
			if ( ! (Array.isArray(_filter[filter.device])) )
				_filter[filter.device] = [];
			_filter[filter.device].push(filter);
			var _tmp = _struct;
			var _tmpLast = null;
			var _attrs = ['extension', 'cid', 'phone', 'device'];
			for ( var x = 0; x < _attrs.length; x++ ) {
				var _attr = filter[_attrs[x]];
				if ( (x + 1) == _attrs.length && _tmpLast ) {
					_tmpLast.o[_tmpLast.a] = _attr;
					break;
				}
				_tmp[_attr] =_tmp[_attr] || {};
				_tmpLast = {o: _tmp, a: _attr};
				_tmp = _tmp[_attr];
			}
		}
		var _found = {};
		for ( var _mac in macToPhn ) {
			if ( owned && ! macToPhn[_mac].owner )
				continue;	/* filter out by owned */
			if ( owned && cids && ! Utils.isInArray(cids, macToPhn[_mac].owner) )
				continue;	/* filter out by owner */
			if ( phones && ! Utils.isInArray(phones, _mac) )
				continue;	/* filter out by phone */
			var _cids = [];
			for ( var _cid in live.cidToPhn ) {
				if ( cids && ! Utils.isInArray(cids, _cid) )
					continue;	/* filter out by contact */
				for ( var i = 0; i < live.cidToPhn[_cid].length; i++ ) {
					var _mp = live.cidToPhn[_cid][i].m + '' + live.cidToPhn[_cid][i].p;
					if ( _mac == _mp ) {
						_cids.push(_cid);	/* Found contact that calls current phone */
						break;
					}
				}
			}
			if ( (cids || extensions) && _cids.length == 0 )
				continue;	/* no matching contacts (and therefore extensions) for this phone; */
			for ( var i = 0; i < macToPhn[_mac].devices.length; i++ ) {
				_dev = macToPhn[_mac].devices[i];
				if ( devices != null && ! Utils.isInArray(devices, _dev) )
					continue;	/* filter out by device */
				if ( ! extensions && (! devToExt[_dev] || devToExt[_dev].l.length == 0) ) {
					/* There are no extensions, but I don't care about extensions.. continue */
					if ( _cids.length == 0 )
						buildFilter({extension: '', cid: '', phone: _mac, device: _dev});
					else
						_cids.forEach(
							function(cid) {
								buildFilter({extension: '', cid: cid, phone: _mac, device: _dev});
							});
					continue;
				}
				if ( ! devToExt[_dev] )
					continue;	/* No extensions and I do care.. skip */
				for ( var j = 0; j < devToExt[_dev].l.length; j++ ) {
					var _ext = devToExt[_dev].l[j].e;
					if ( extensions && ! Utils.isInArray(extensions, _ext) )
						continue;	/* filter out by extension */
					var _hits = 0;
					for ( var k = 0; k < live.extToCid[_ext].l.length; k++ ) {
						var _cid = live.extToCid[_ext].l[k].i;
						if ( cids && ! Utils.isInArray(_cids, _cid) )
							continue;
						buildFilter({extension: _ext, cid: _cid, phone: _mac, device: _dev});
						_hits++;
					}
					if ( ! _hits && owned ) {
						/* An owned device is called through a non-selected contact, but include if 'owned' requested */
						buildFilter({extension: _ext, cid: null, phone: _mac, device: _dev});
					}
				}
			}
		}

		if ( Utils.isEmpty(_filter) )
			return PBXError.HOOK_NO_DEVICE;
		gHid++;
		lookUp.hid[gHid] = [];
		hidStruct[gHid] = _struct;
		for ( var _device in _filter ) {
			if ( lookUp.dev[_device] ) {
				lookUp.dev[_device].hook(callback, _filter[_device], gHid);
				lookUp.hid[gHid].push(lookUp.dev[_device]);
			}
		}
		return gHid;
	}

	/**
	 * Callback from a park hook. Park callbacks are cached on a per-hook basis.
	 * A park orbit hook is a special case of a device callback.
	 * @callback Callback~parkCB
	 * @param {Object} filter The filter that was used for this hook
	 * @param {Number} hid The hook ID of the hook that is firing
	 * @param {IPCortex.PBX.device} device The park object that has a state change
	 */
	/**
	 * Hook a park orbit based on the Pick/nnn device name. Used internally by
	 * {@link IPCortex.PBX.address}
	 * @param {String[]} dev The device name of the park orbit. ("Park/nnn")
	 * @param {Callback~parkCB} callback Called for each device event received.
	 * @return {Number} Hook ID that identifies this hook request, or error code (< 0).
	 * @memberOf IPCortex.PBX
	 */
	function hookPark(dev, callback) {
		if ( typeof(callback) != 'function' )
			return PBXError.HOOK_BAD_CALLBACK;
		if ( dev.search(/^Park\/\d+$/) == -1 )
			return PBXError.HOOK_NOT_PARK;
		if ( ! lookUp.dev[dev] )
			lookUp.dev[dev] = device.create(dev);

		gHid++;
		lookUp.dev[dev].hook(callback, {device: dev}, gHid);
		lookUp.hid[gHid] = [lookUp.dev[dev]];
		return gHid;
	}

	/**
	 * Callback from a mailbox hook. Mailbox callbacks are cached on a per-hook basis.
	 * @callback Callback~mailboxCB
	 * @param {Object} filter The filter that was used for this hook
	 * @param {Number} hid The hook ID of the hook that is firing
	 * @param {IPCortex.PBX.mailbox} mailbox The mailbox object that has a state change
	 */
	/**
	 * Hook mailbox(es) based on the mailbox id
	 * @param {String[]} mboxs The mailbox IDs as an array, or NULL for all.
	 * @param {Callback~mailboxCB} callback Called for each mailbox event received.
	 * @return {Number} Hook ID that identifies this hook request, or error code (< 0).
	 * @memberOf IPCortex.PBX
	 */
	function hookMailbox(mboxs, callback) {
		if ( typeof(callback) != 'function' )
			return PBXError.HOOK_BAD_CALLBACK;

		mboxs = [].concat(mboxs);
		var _match = [];
		for ( var x in lookUp.mbx ) {
			if( mboxs == null || Utils.isInArray(mboxs, x) )
				_match.push(x);
		}
		if ( _match.length == 0 )
			return PBXError.HOOK_NO_MBOX;

		gHid++;
		lookUp.hid[gHid] = [];
		for ( var i = 0; i < _match.length; i++ ) {
			lookUp.mbx[_match[i]].hook(callback, {mboxs: _match}, gHid);
			lookUp.hid[gHid].push(lookUp.lookUp.mbx[_match[i]]);
		}
		return gHid;
	}

	/**
	 * Callback from a queue hook. Queue callbacks are stored on a per-hook basis.
	 * @callback Callback~queueCB
	 * @param {Object} filter The filter that was used for this hook
	 * @param {Number} hid The hook ID of the hook that is firing
	 * @param {IPCortex.PBX.queue} queue The mailbox object that has a state change
	 */
	/**
	 * Hook queue(s) based on the queue id
	 * @param {String[]} queues The queue IDs or extensions as an array, or NULL for all.
	 * A queue ID is of the form 'Queue/q_nnn' but can be shortened to 'nnn' if preferred.
	 * 'nnn' will be the same as the Queue's extension number. Use listExtension('Q') to
	 * obtain a list of queues.
	 * @param {Callback~queueCB} callback Called for each queue event received.
	 * @return {Number} Hook ID that identifies this hook request, or error code (< 0).
	 * @memberOf IPCortex.PBX
	 */
	function hookQueue(queues, callback) {
		if ( typeof(callback) != 'function' )
			return PBXError.HOOK_BAD_CALLBACK;

		var _match = [];
		if(queues == null) {
			for(var q in lookUp.que) {
				_match.push(q);
			}
		}
		else {
			queues = [].concat(queues);
			for (var i = 0; i < queues.length; i++) {
				if (lookUp.que[queues[i]])
					_match.push(queues[i]);
				else if (lookUp.que['Queue/q_' + queues[i]])
					_match.push('Queue/q_' + queues[i]);
			}
		}

		if ( _match.length == 0 )
			return PBXError.HOOK_NO_QUEUE;

		gHid++;
		lookUp.hid[gHid] = [];
		for ( var i = 0; i < _match.length; i++ ) {
			lookUp.que[_match[i]].hook(callback, {queues: _match}, gHid);
			lookUp.hid[gHid].push(lookUp.que[_match[i]]);
		}
		return gHid;
	}

	/**
	 * Callback from an XMPP hook
	 * @callback Callback~xmppCB
	 * @param {Object} filter The filter that was used for this hook
	 * @param {Number} hid The hook ID of the hook that is firing
	 * @param {IPCortex.PBX.xmpp} device The XMPP instance that has a state change
	 */
	/**
	 * Hook a contact's XMPP events (State changes)
	 * @param {Number|String} cid Contact ID to hook, or XMPP ID,
	 *  this can be fetched using address.get('xmppid') or room..get('xmppid')
	 * @param {Callback~xmppCB} callback Called for each xmpp event received.
	 * @return {Number} Hook ID that identifies this hook request, or error code (< 0).
	 * @memberOf IPCortex.PBX
	 */
	function hookXmpp(cid, callback, filter) {
		if ( ! cid || typeof(callback) != 'function' )
			return PBXError.HOOK_BAD_CALLBACK;
		var _device = cid;
		if ( isNaN(cid) ) {
			if ( _device.substr(0, 7) != 'Custom/' )
				_device = 'Custom/' + _device;
			if ( _device.search(/^Custom\/.+@.+$/) == -1 && _device.search(/^Custom\/\d+/) == -1 )
				return PBXError.HOOK_BAD_XMPP;
			cid = null;
		} else {
			var _user = getUser(cid);
			if ( ! _user || ! _user.cid )
				return PBXError.HOOK_BAD_XMPP;
			_device = 'Custom/' + _user.cid;
		}
		if ( ! lookUp.xmpp[_device] ) {
			lookUp.xmpp[_device] = xmpp.create(_device);
			if ( live.userData.id && _device == 'Custom/' + live.userData.id )
				cH.xmpp = lookUp.xmpp[_device];
		}
		gHid++;
		var filter = filter || {};
		filter.cid = cid;
		filter.xmpp = _device;
		lookUp.xmpp[_device].hook(callback, filter, gHid);
		lookUp.hid[gHid] = [lookUp.xmpp[_device]];
		return gHid;
	}

	/**
	 * Callback from an Contact hook
	 * @callback Callback~contactCB
	 * @param {Object} filter The filter that was used for this hook
	 * @param {Number} hid The hook ID of the hook that is firing
	 * @param {IPCortex.PBX.contact} device The Contact instance that has a state change
	 */
	/**
	 * Hook a contact's events (eg. BLF). Used internally by {@link IPCortex.PBX.address}
	 * @param {Number} cid Contact ID to hook
	 * @param {Callback~contactCB} callback Called for each contact event received.
	 * @return {Number|IPCortex.PBX.errors} Hook ID that identifies this hook request, or error code (< 0).
	 * @memberOf IPCortex.PBX
	 */
	function hookContact(cid, callback) {
		if ( ! cid || typeof(callback) != 'function' )
			return PBXError.HOOK_BAD_CALLBACK;
		var _user = getUser(cid);
		if ( ! _user || ! _user.name )
			return PBXError.HOOK_NO_CONTACT;
		if ( ! lookUp.cnt[cid] )
			lookUp.cnt[cid] = contact.create(cid);
		gHid++;
		lookUp.cnt[cid].hook(callback, {cid: cid, name: _user.name}, gHid);
		lookUp.hid[gHid] = [lookUp.cnt[cid]];
		return gHid;
	}

	/**
	 * Callback from a room hook
	 * @callback Callback~roomCB
	 * @param {Object} filter The filter that was used for this hook
	 * @param {Number} hid The hook ID of the hook that is firing
	 * @param {IPCortex.PBX.room} device The room instance that has a state change
	 */
	/**
	 * Hook a chat room's events - Typically new messages
	 * @param {Number} roomid Room ID to hook
	 * @param {Callback~roomCB} callback Called for each room event received.
	 * @return {Number|IPCortex.PBX.errors} Hook ID that identifies this hook request, or error code (< 0).
	 * @memberOf IPCortex.PBX
	 */
	function hookRoom(roomid, callback) {
		if ( typeof(callback) != 'function' )
			return PBXError.HOOK_BAD_CALLBACK;
		if ( ! lookUp.room[roomid] )
			return PBXError.HOOK_NO_ROOM;
		gHid++;
		lookUp.room[roomid].hook(callback, {roomID: roomid}, gHid);
		lookUp.hid[gHid] = [lookUp.room[roomid]];
		return gHid;
	}

	/**
	 * Destroy an existing hook
	 * @param {Number} Hook ID that identifies the hook
	 * @memberOf IPCortex.PBX
	 */
	function unHook(uhid) {
		if ( ! lookUp.hid[uhid] )
			return;
		var _hook = lookUp.hid[uhid];
		lookUp.hid[uhid] = null;
		delete lookUp.hid[uhid];
		delete hidStruct[uhid];

		if ( !_hook || !(Array.isArray(_hook)) )
			return;

		while( _hook.length ) {
			var _h = _hook.shift();
			if ( typeof _h.unhook == 'function' )
				_h.unhook(uhid);
		}
	}

	/**
	 * @return Bool is JsSIP loaded, and are we using HTTPS
	 * @private
	 */
	function haveJsSIP() {

        console.log('haveJsSIP 14:07 - plugins: ',window.cordova.plugins);

        console.log('14:07 - new api - RTCPeerConnection: ',typeof RTCPeerConnection );

        console.log('14:07 - new api -  PeerConnection: ', typeof PeerConnection ); // not visible
console.log('new api - haveJsSIP', (typeof JsSIP == 'object' ? 'found JsSIP' : 'NO JsSIP'), 'uri = ', live.origURI.substr(0,8), 'RTCPeerConnection', (typeof RTCPeerConnection == 'function' ? 'found' : 'absent'));


        return true;


		return (typeof JsSIP == 'object' && live.origURI.substr(0,8) == 'https://' && typeof  RTCPeerConnection== 'function' );
	}

	function validateMessage(msg, sigtype) {
		if ( msg.id == null || ! msg.type ) {
			console.log('malformed special message', msg);
			return false;
		}
		if ( typeof specialFeatures.handlers[msg.type] != 'function' ) {
			console.log('unhandled message type ', msg);
			return false;
		}
		if ( typeof specialFeatures.callbacks[msg.type] != 'function' ) {
			console.log('message type not enabled ', msg);
			return false;
		}
		if ( ! Utils.isInArray(specialFeatures.transports[msg.type], sigtype) ) {
			console.log('message type not enabled for this transport', msg);
			return false;
		}
		feature._handles[msg.type] = feature._handles[msg.type] || {};
		return true;
	}

	/**
	 * Enable an optional feature. A Special feature (currently 'file' and 'av') is
	 * made available when its class loads and declates a transport mechanism that is
	 * also present and loaded.
	 * 
	 * @param {String} feature Feature name
	 * @param {function} callback The callback function needed for the feature to provide updates.
	 * @param {Array} tlist A list of transport names that you want to use.
	 * @return {Array} A list of accepted transport names that are enabled or 'null' if none.
	 * @memberOf IPCortex.PBX
	 */
	function enableFeature(featurename, callback, tlist) {
		if ( typeof specialFeatures.handlers[featurename] != 'function' ) {
			console.log('cannot enable unsupported feature ' + featurename);
			return null;
		}
		if ( typeof callback != 'function' ) {
			console.log('cannot enable ' + featurename + ' with illegal callback', callback);
			return null;
		}
		if ( ! (Array.isArray(tlist)) ) {
			console.log('cannot enable ' + featurename + ' with illegal transport list', tlist);
			return null;
		}
		if ( ! specialFeatures.handlers[featurename].validate() ) {
			console.log('cannot enable feature ' + featurename + ' on this browser');
			return null;
		}
		var allowed = [];
		feature._handles[featurename] = feature._handles[featurename] || {};
		tlist.forEach(function(v) {
			if ( specialFeatures.handlers[featurename]._transports[v] )
				allowed.push(v);
		});
		if ( allowed.length ) {
			specialFeatures.callbacks[featurename] = callback;
			specialFeatures.transports[featurename] = [].concat(allowed);
/* TODO: Call initialiser for any pre-existing transports (rooms) - ie restrospective ping */
			return allowed;
		}
		return null;
	}

	/**
	 * Disable a feature previously enabled by enableFeature()
	 * 
	 * @param {String} feature Feature name
	 * @memberOf IPCortex.PBX
	 */
	function disableFeature(featurename) {
		if ( typeof specialFeatures.handlers[featurename] != 'function' ) {
			console.log('cannot disable unsupported feature ' + featurename);
			return null;
		}
		delete specialFeatures.callbacks[featurename];
		delete specialFeatures.transports[featurename];
		delete feature._handles[featurename];
		return null;
	}


	/**
	 * Realtime option to override STUN and TURN servers to be used by WebRTC based components.
	 * The default is set from the PABX.
	 * 
	 * @param {String} stun FQHN or FQHN:port for the stun server.
	 * @param {Array} turn List of Objects containing: {urls:, username:, credential:}
	 * @memberOf IPCortex.PBX
	 */
	function setIce(stun, turns) {
		if ( ! stun )
			live.stunServer = '';
		else {
			var _host = stun.split(':')[0];
			var _port = stun.split(':')[1] || 3478;
			live.stunServer = 'stun:' + _host + ':' + _port;
		}

		if ( ! turns || ! Array.isArray(turns) || turns.length == 0 )
			live.turnServers = [];
		else {
			var _tmp = [].concat(turns); /* Make a copy so we can destroy it */
			live.turnServers = [];
			while ( _tmp.length ) {
				var _turn = _tmp.shift();
				if( ! typeof _turn == 'object' || ! _turn.urls )
					continue;
				live.turnServers.push({
							urls:		_turn.urls,
							username:	_turn.username || '',
							credential:	_turn.credential || ''
						});
			}
			var _host = stun.split(':')[0];
			var _port = stun.split(':')[1] || 3478;
			live.stunServer = 'stun:' + _host + ':' + _port;
		}
	}


	/** @constructs Api */
	var Api = new Class( /** @lends Api.prototype */ {
			_private:
			{
				uid:	1
			},
			/**
			 * Generic class destructor - Must be called manually in JS.
			 * @private
			 */
			destroy: function() {
				var _this = this;
				var _clear = [
					{o: lookUp.dev,		i: device,	k: 'device'},
					{o: lookUp.xmpp,	i: xmpp,	k: 'device'},
					{o: lookUp.room,	i: room,	k: 'roomID'}
				];
				if ( typeof this.pre_destroy == 'function' ) {
					this.pre_destroy();
				}
				/* Unhook all */
				this.unhookall();
				/* Attempt to remove this item from the lookup object */
				for ( var i = 0; i < _clear.length; i++ ) {
					if ( ! (this instanceof _clear[i].i) )
						continue;
					if ( ! this.attr[_clear[i].k] )
						continue;
					if ( _clear[i].o[this.attr[_clear[i].k]] !== this )
						continue;
					_clear[i].o[this.attr[_clear[i].k]] = null;
					delete _clear[i].o[this.attr[_clear[i].k]];
				}
				/* Recursively remove - Do not descend into another classes reference. */
				function remove(object) {
					for ( var _key in object ) {
						if ( ! object[_key] || _key.search(/^_/) != -1 )
							continue;
						if ( typeof(object[_key]) == 'object' && ! object[_key].nodeName &&
								! (object[_key].constructor && object[_key].constructor._isClass) && ! isMediaStream(object[_key]) )
							remove(object[_key]);
						object[_key] = null;
						delete object[_key];
					}
				}
				remove(this);
			},
			/**
			 * Special unhook-all method for pre-object destruction.
			 * 
			 * @private
			 */
			unhookall: function() {
				while ( this.hooks && this.hooks.length )
					unHook(this.hooks.shift().hid);
				this.hooks = [];
			},
			/**
			 * Generic base-class getter
			 * @param {String|Number} attr Key for data to get.
			 * @returns {*} Attribute value
			 */
			get:	function(attr) {
				if ( ! this.attr )
					return null;
				return this.attr[attr];
			},
			/**
			 * Generic base-class setter
			 * @param {String|Number} attr Key for data to store.
			 * @param value Value to store
			 */
			set:	function(attr, value) {
				if ( ! attr && typeof(value) == 'object' ) {
					for ( var key in value )
						this.attr[key] = value[key];
				} else if ( attr )
					this.attr[attr] = value;
			},
			/**
			 * Generic Hook method.
			 * @param {function} hook The callback function for running this hook
			 * @param {Object} filter Describes the filter used to generate this hook {roomID: roomID}
			 * @param {Number} hid Hook ID number, passed to hook as 2nd parameter
			 */
			hook:	function(callback, filter, hid) {
				if ( ! hid ) {
					gHid++;
					lookUp.hid[gHid] = [this];
					hid = gHid;
				}
				if ( ! filter )
					filter = {};

				if ( Array.isArray(this.hooks) )
					this.hooks.push({run: callback, filter: filter, hid: hid});

				var _this = this;
				function initialCB() {
					callback(filter, hid, _this);
				}
				setTimeout(initialCB, 1);

				return hid;
			},
			/**
			 * Generic unhook method.
			 * @param {Number} hid Hook ID number to remove
			 * @private
			 */
			unhook:	function(hid) {
				if ( Array.isArray(this.hooks) ) {
					for ( var i = this.hooks.length - 1; i >= 0; i-- ) {
						if ( this.hooks[i].hid == hid )
							this.hooks.splice(i, 1);
					}
				}
			},
			_result: function(callback, content) {
				if ( ! callback || ! typeof content == 'string' )
					return;
				if ( content.search(/<response.*result="success"/) != -1 )
					callback(true, content);
				else
					callback(false, content);
			}
		});

	var pc = Api.extend({
		_config:
			{
				timeout:	4000,
				chunkSize:	1000,
			},
		construct:
			function(handler, cid, features, callback) {
				if ( typeof(callback) != 'function' )
					return null;
				this.attr = {
					pcs:		{},
					destroy:	null,	
					cid:		cid,
					handler:	handler,
					callback:	callback,
					features:	features,
					streams:	0,
					remotebrowser:	'unknown'
				};
				this._setup(0);
			},
		pre_destroy:
			function() {
				for ( var x in this.attr.pcs ) {
					/* this.attr.callback(this.attr.cid, 'closed', 'Connection closed!', x); */
					var _thispc = this.attr.pcs[x];
					_thispc.schannel = null;
					_thispc.rchannel = null;
					_thispc.streams = null;
					_thispc.pc = null;
				}
				this.attr.callback(this.attr.cid, 'closed', 'Connection closed!');
console.log('PRE-DESTROY PC', this.attr.cid);
			},
		_setup:	function(pID) {
                console.log('api::_setUp id: ',pID);
				var _this = this;
				var cid = this.attr.cid;
				var handler = this.attr.handler;
				var callback = this.attr.callback;
				var features = this.attr.features;
				if ( ! this.attr.pcs[pID] ) {
					this.attr.pcs[pID] = {
								id:             pID,
								pc:             null,
								datacb:         null,
								timeout:        null,
								transfer:       null,
								schannel:       null,
								rchannel:       null,
								complete:       false,
								icetimer:       null,
								ice:            [],
								streams:	[],
								rStreams:	[],
								md5:            features.md5,
								size:           features.size
							};
				}
				var _thispc = this.attr.pcs[pID];
				function state(e) {
					pID = _thispc.id;
					if ( _this._closed(pID) )
						return;
					if ( e.target.iceConnectionState == 'checking' )
						return _this._clearTimeout(pID);
					if ( e.target.iceConnectionState == 'connecting' )
						return _this._clearTimeout(pID);
					if ( e.target.iceConnectionState.search(/^(connected|completed)$/) == -1 )
						return;
					callback(_this.attr.cid, 'connected', null, pID);
					_this._clearTimeout(pID);
				}
				function ice(e) {
					pID = _thispc.id;
					if ( ! e.candidate )
						return;
					function send() {
						handler.post({type: 'candidates', dst: _this.attr.cid, ice: _thispc.ice, pid: pID}, 'transport/signal');
						_thispc.iceTimer = null;
						_thispc.ice = [];
					}
					_thispc.ice.push({
						sdpMLineIndex:	e.candidate.sdpMLineIndex,
						candidate:	e.candidate.candidate
					});
					if ( ! _thispc.iceTimer )
						_thispc.iceTimer = setTimeout(send, 1000);
				}
				var iceServers = (live.stunServer ? [ {url: live.stunServer} ] : []).concat(live.turnServers);

                console.log('api::Making new RTCPeerConnection');
				var _pc = new RTCPeerConnection(
					{iceServers: iceServers},
					{optional: [
						{DtlsSrtpKeyAgreement: true}
					]}
				);
				_pc.oniceconnectionstatechange = state;
				_pc.onicecandidate = ice;
				_thispc.pc = _pc;
				this.attr.streams++;
				if ( features.audio || features.video ) {
					function media(e) {
						pID = _thispc.id;
						if ( _this._closed(pID) )
							return;
						if ( ! e.stream )
							return;
						_thispc.rStreams = _thispc.pc.getRemoteStreams();
						callback(cid, 'remoteMedia', e.stream, pID);
					}
					_pc.onremovestream = media;
					_pc.onaddstream = media;
				}
				if ( features.data ) {
					var _md5 = null;
					var _chunks = [];
					var _received = 0;
					if ( _thispc.md5 && typeof SparkMD5 == 'function' )
						_md5 = new SparkMD5.ArrayBuffer();
					function open() {
						pID = _thispc.id;
						if ( _this._closed(pID) )
							return;
						if ( typeof(_thispc.datacb) == 'function' )
							_thispc.datacb();
						_thispc.datacb = null;
					}
					function close() {
						pID = _thispc.id;
						if ( _this._closed(pID) || _thispc.complete )
							return;
						_this._error(pID, 'Data channel closed unexpectedly!');
					}
					function error(e) {
						pID = _thispc.id;
						if ( _this._closed(pID) )
							return;
						_this._error(pID, e.message);
					}
					function timeout() {
						pID = _thispc.id;
						_chunks = [];
						if ( _this._closed(pID) && _received == _thispc.size )
							return;
						_this._error(pID, 'Timed out while receiving data!');
					}
					function message(e) {
						if ( e.data instanceof Blob ) {
							var _reader = new FileReader();
							_reader.onloadend = function() {
								message({data: _reader.result});
							};
							_reader.readAsArrayBuffer(e.data);
							return;
						}
						pID = _thispc.id;
						if ( _thispc.transfer )
							clearTimeout(_thispc.transfer);
						if ( _this._closed(pID) ) {
							_chunks = [];
							return;
						}
						_chunks.push(e.data);
						if ( e.data instanceof ArrayBuffer ) {
							if ( _md5 )
								_md5.append(e.data);
							_received += e.data.byteLength;
						} else
							_received += e.data.length;
						if ( _received == _thispc.size ) {
							if ( _md5 && _thispc.md5 != _md5.end() ) {
								_this._error(pID, 'MD5 miss match!');
								return;
							}
							if ( e.data instanceof ArrayBuffer )
								callback(cid, 'complete', _chunks, pID);
							else
								callback(cid, 'complete', _chunks.join(''), pID);
							_thispc.complete = true;
							_chunks = [];
							return;
						}
						_thispc.transfer = setTimeout(timeout, pc._config.timeout);
						callback(cid, 'transferring', _received, pID);
					}
					function data(e) {
						pID = _thispc.id;
						if ( _this._closed(pID) )
							return;
						_thispc.rchannel = e.channel;	
						e.channel.onmessage = message;
						e.channel.onerror = error;
						e.channel.onclose = close;
					}
					var _sChannel = _pc.createDataChannel('sendDataChannel', {reliable: true});
					_thispc.schannel = _sChannel;
					_sChannel.onmessage = message;
					_sChannel.onerror = error;
					_sChannel.onclose = close;
					_sChannel.onopen = open;
					_pc.ondatachannel = data;
				}
				return _thispc;
			},
		_closed:
			function(pID, final) {
				var _this = this;
if ( ! this.attr )
console.error('PC called after destroy!!! Check backtrace and fixme!');
				var _thispc = this.attr.pcs[pID];
				if ( ! _thispc || _thispc.pc.iceConnectionState.search(/^(closed|disconnected)$/) == -1 )
					return false;

				function destroy() {
					_this.attr.destroy = null;
					while ( _thispc.rStreams.length ) {
						/* Firefox is broken! */
						if ( _thispc.rStreams[0].ended == null )
							_thispc.rStreams[0].ended = true;
						_this.attr.callback(_this.attr.cid, 'remoteMedia', _thispc.rStreams.shift(), _thispc.id);
					}
					if ( _thispc.iceTimer )
						clearTimeout(_thispc.iceTimer);
					_thispc.onremovestream = null;
					_thispc.onaddstream = null;
					if ( _this.attr.streams <= 1 )
						return _this.destroy();
					delete _this.attr.pcs[pID];
					_this.attr.streams--;
console.log('pc', pID, 'destroy delayed', _this.attr.streams, 'streams left');
				}
				if ( _thispc.transfer )
					clearTimeout(_thispc.transfer);
				if ( this.attr.destroy )
					clearTimeout(this.attr.destroy);
				if ( _thispc.pc.iceConnectionState == 'closed' || final)
					this.attr.destroy = setTimeout(destroy, 250);
				else
					this.attr.destroy = setTimeout(destroy, 10000);
				this._clearTimeout(pID);
				return true;
			},
		_error:	function(pID, msg) {
				if ( this.attr.pcs[pID] && this.attr.pcs[pID].timeout )
					clearTimeout(this.attr.pcs[pID].timeout);
				this.attr.callback(this.attr.cid, 'error', msg, pID);
			},
		_setTimeout:
			function(pID, ms) {
				if ( ! this.attr.pcs[pID] || this.attr.pcs[pID].timeout )
					return;
				var _this = this;
				function close() {
					_this._error(pID, 'PC timed out waiting for response!');
					_this.close(pID);
				}
				if ( this.attr.pcs[pID].pc.iceConnectionState.search(/^(connected|completed)$/) == -1 )
					this.attr.pcs[pID].timeout = setTimeout(close, ms);
			},
		_clearTimeout:
			function(pID) {
				if ( this.attr.pcs[pID] && this.attr.pcs[pID].timeout ) {
					clearTimeout(this.attr.pcs[pID].timeout);
					this.attr.pcs[pID].timeout = null;
				}
			},
		_getpc:	function(pID) {
				if ( pID && this.attr.pcs[pID] )
					return this.attr.pcs[pID];
				if ( pID && ! this.attr.pcs[0] )
					return null;
				while ( ! pID ) {
					pID = parseInt(Math.random() * 100000, 10) + 1;
					if ( this.attr.pcs[pID] )
						continue;
				}
				if ( ! this.attr.pcs[0] )
					return this._setup(pID);
				this.attr.pcs[0].id = pID;
				this.attr.pcs[pID] = this.attr.pcs[0];
				delete this.attr.pcs[0];
				return this.attr.pcs[pID];
			},
		_sendSdp:
			function(pID, sd) {
				var _thispc = this._getpc(pID);
				_thispc.pc.setLocalDescription(sd);
				if ( _thispc.pc.iceConnectionState == 'new' )
					this.attr.callback(this.attr.cid, 'connecting', sd.sdp, pID);
				var _sd = {
					dst:		this.attr.cid,
					sdp:		sd.sdp,
					type:		sd.type,
					browser:	webrtcDetectedBrowser || 'unknown',
					pid:		pID
				};
				this.attr.handler.post(_sd, 'transport/signal');
			},
		_setRemoteSdp:
			function(sd) {
				var _this = this;
				var pID = sd.pid;
				var _thispc = this._getpc(pID);
				function ok() {
					_this.attr.remotebrowser = sd.browser || 'unknown';
				}
				function error(e) {
					_this._error(pID, e.message);
				}
				if ( _thispc ) {
					sd.pid = pID = _thispc.id;
					_thispc.pc.setRemoteDescription(new RTCSessionDescription(sd), ok, error);
				} else
					this._error(pID, 'Failed to find PC for remote SDP');
			},
		_candidates:
			function(ice, pID) {
				var _this = this;
				var _thispc = this._getpc(pID);
				ice = [].concat(ice);
				function ok(e) { /* No-Op */ }
				function error(e) {
					_this._error(pID, e.message);
				}
				if ( _thispc ) {
					while ( ice.length )
						_thispc.pc.addIceCandidate(new RTCIceCandidate(ice.pop()), ok, error);
				} else
					this._error(pID, 'Failed to find PC for remote ICE');
			},
		offerAll:
			function() {
				var _skip = 0;
				if ( this.attr.pcs[0] )
					_skip = this.offer();
				for ( var x in this.attr.pcs ) {
					if ( _skip == x )
						continue;
					this.offer(x);
				}
			},
		offer:	function(pID) {
				/* pID is set to re-offer or null for new offer */
				var _this = this;
				var _thispc = this._getpc(pID);
				function send(sd) {
					_this._sendSdp(pID, sd);
				}
				function error(e) {
					_this._error(pID, e.message);
				}
				if ( _thispc ) {
					pID = _thispc.id;
					_thispc.pc.createOffer(send, error, {optional: [], mandatory: {offerToReceiveVideo: 5, offerToReceiveAudio: 5}});
					this._setTimeout(pID, pc._config.timeout);
				} else
					this._error(pID, 'Failed to find PC for re-offer');
				return _thispc.id;
			},
		_answer:
			function(pID) {
				var _this = this;
				var _thispc = this._getpc(pID);
				function send(sd) {
					_this._sendSdp(pID, sd);
				}
				function error(e) {
					_this._error(pID, e.message);
				}
				if ( _thispc )
					_thispc.pc.createAnswer(send, error);
				else
					this._error(pID, 'Failed to find PC for answer');
			},
		handle:	function(msg) {
				if ( typeof(msg) != 'object' )
					return;
				if ( msg.dst != live.userData.id || ! msg.type )
					return;
console.log('pc handler', msg.type, msg.pid /* , msg */);
				if ( this._closed(msg.pid) )
					return;
				switch ( msg.type ) {
					case 'offer':
						this._setRemoteSdp(msg);
						this._answer(msg.pid);
						this._setTimeout(msg.pid, pc._config.timeout);
						break;
					case 'answer':
						this._setRemoteSdp(msg);
						this._clearTimeout(msg.pid);
						this._setTimeout(msg.pid, pc._config.timeout);
						break;
					case 'candidates':
						this._candidates(msg.ice, msg.pid);
						this._clearTimeout(msg.pid);
						break;
				}
			},
		sendData:
			function(data) {
				var _this = this;
				var _thispc = this._getpc();
				if ( typeof(data) != 'string' && ! (data instanceof File) ) {
					this._error(_thispc.id, 'Invalid data type!');
					return;
				}
				if ( ! this.attr.features.data ) {
					this._error(_thispc.id, 'Invalid PC type. Not configured for data!');
					return;
				}
				function send() {
					var pID = _thispc.id;
					if ( _this._closed(pID) )
						return;
					var _sent = 0;
					var _tries = 0;
					var _offset = 0;
					var _reader = null;
					function done() {
						if ( _this._closed(pID) ) {
							if ( _thispc.transfer )
								clearTimeout(_thispc.transfer);
							return;
						}
						try {
							_thispc.schannel.send(_reader.result);
						} catch(e) {
							if ( _tries > 9 ) {
								_this._error(pID, 'Timed out while sending data!');
								return;
							}
							_thispc.transfer = setTimeout(done, Math.round(pc._config.timeout / 10));
							_tries++;
							return;
						}
						if ( _reader.result instanceof ArrayBuffer )
							_sent += _reader.result.byteLength;
						else
							_sent += _reader.result.length;
						if ( _sent == _thispc.size ) {
							if ( _thispc.transfer )
								clearTimeout(_thispc.transfer);
							_this.attr.callback(_this.attr.cid, 'complete', null, pID);
							_thispc.complete = true;
							return;
						}
						_offset = (_offset + pc._config.chunkSize);
						var _blob = data.slice(_offset, _offset + pc._config.chunkSize);
						if ( data instanceof File )
							_reader.readAsArrayBuffer(_blob);
						else {
							_reader.result = _blob;
							done();
						}
						_this.attr.callback(_this.attr.cid, 'transferring', _sent, pID);
						_tries = 0;
					}
					var _blob = data.slice(_offset, _offset + pc._config.chunkSize);
					if ( data instanceof File ) {
						_reader = new FileReader();
						_reader.onloadend = done;
						_reader.readAsArrayBuffer(_blob);
					} else {
						_reader.result = _blob;
						done();
					}
				}
				if ( _thispc.schannel && _thispc.schannel.readyState == 'open' )
					send();
				else {
					_thispc.datacb = send;
					this.offer(_thispc.id);
				}
			},
		addStream:
			function(stream) {
				/* if is chrome-2-chrome, and streams == 1, add to existing */
				/* if not chrome, look for an empty stream to add to, otherwise make new */
				var _canAddStreams = (webrtcDetectedBrowser == 'chrome' && this.attr.remotebrowser == 'chrome');
				var _thispc = null;
				var _isnew = false;
				for ( var x in this.attr.pcs ) {
					if ( this._closed(x) )
						continue;
					if ( _canAddStreams || this.attr.pcs[x].streams.length == 0 ) {
						_thispc = this.attr.pcs[x];
console.log('addStream: using existing pc', x);
						break;
					}
				}
				if ( ! _thispc ) {
					_isnew = true;
					_thispc = this._getpc();
console.log('addStream: using new pc', _thispc.id);
				}
				try {
					_thispc.pc.addStream(stream);
				} catch ( e ) { 
console.error('error doing addStream');
					this.attr.callback(this.attr.cid, 'error', e.message, _thispc.id);
					return false;
				}
				_thispc.streams.push(stream);
				/* Short cut when adding stream if already connected! */
				if ( _isnew || _thispc.pc.iceConnectionState.search(/^(connected|completed)$/) != -1 )
					this.offer(_thispc.id);
				return true;
			},
		removeStream:
			function(stream) {
				/* loop through pc entries looking for the stream, and remove if found. */
				var _canAddStreams = (webrtcDetectedBrowser == 'chrome' && this.attr.remotebrowser == 'chrome');
console.log('removeStream');
				for ( var x in this.attr.pcs ) {
					_thispc = this.attr.pcs[x];
					var i = _thispc.streams.length;
					while ( i-- ) {
						if ( _thispc.streams[i] === stream ) {
							_thispc.streams.splice(i, 1);
							try {
console.log('found stream to remove', this.attr.cid, _thispc.id);
								_thispc.pc.removeStream(stream);
							} catch ( e ) {
								this.attr.callback(this.attr.cid, 'error', e.message, _thispc.id);
								return false;
							}
							/* Short cut when removing stream if already connected! */
							if ( ! _canAddStreams || _thispc.streams.length == 0 )
								this.close(_thispc.id);	/* TODO really? not sure. */
							else if ( _thispc.pc.iceConnectionState.search(/^(connected|completed)$/) != -1 )
								this.offer(_thispc.id); /* Re-offer with reduced number of streams */
							return true;
						}
					}
				}
				return false;
			},
		resetStreams:
			function() {
				var _thispc;
				var _toClose = {};
				var _running = 0;
console.log('resetStreams', this.attr.pcs);
				for ( var x in this.attr.pcs ) {
					_thispc = this.attr.pcs[x];
console.log('resetting stream count:', _thispc.streams.length, _thispc.pc.iceConnectionState, _thispc);
					if ( _thispc.streams.length > 0 && _thispc.pc.iceConnectionState != 'new' ) {
						_toClose[x] = this._getpc();
						while ( _thispc.streams.length ) {
							var _s = _thispc.streams.shift();
							try {
								_thispc.pc.removeStream(_s);
							} catch ( e ) {  };
							try {
								_toClose[x].pc.addStream(_s);
								_toClose[x].streams.push(_s);
							} catch ( e ) { 
								this.attr.callback(this.attr.cid, 'error', e.message, _toClose[x].id);
								return false;
							}
							this.close(x);	/* Should be a no-op, but let's be sure */
							_running++;
						}
					} else
						_running ++;
				}
				/* Ensure that this connector has at least 1 pc present */
				if ( _running == 0 )
{
console.log('ALERT! No steams after resetStreams');
					this._setup(0);
}
			},
		close:	function(pID) {
				/* pID to close 1 stream, null to close all */
				var obj = {};
				if ( pID == null )
					obj = this.attr.pcs;
				else if ( this.attr.pcs[pID] )
					obj[pID] = true;
				for ( var x in obj ) {
					var _thispc = this.attr.pcs[x];
					if ( this._closed(x, pID == null) )
						continue;
					if ( _thispc.rchannel ) {
						try {
							_thispc.rchannel.close();
						} catch ( e ) {
							console.log(e.message);
						}
					}
					if ( _thispc.schannel ) {
						try {
							_thispc.schannel.close();
						} catch ( e ) {
							console.log(e.message);
						}
					}
					if ( _thispc.pc ) {
						try {
							_thispc.pc.close();
						} catch ( e ) {
							console.log(e.message);
						}
					}
				}
			}
	});
	
	var feature = Api.extend({
		_handles:
			{},
		_status:
			{
				timeout:	-2,
				error:		-1,
				unknown:	0,
				offered:	1,
				acknowledged:	2,
				accepted:	3,
				connecting:	4,
				connected:	5,
				localMedia:	6,
				remoteMedia:	7,
				transferring:	8,
				rejected:	9,
				cancelled:	10,
				complete:	11,
				closed:		12
			},
		hook:	function(callback, filter, hid) {
				if ( ! hid ) {
					gHid++;
					lookUp.hid[gHid] = [this];
					hid = gHid;
				}
				if ( ! filter )
					filter = {};
				if ( Array.isArray(this.hooks) )
					this.hooks.push({run: callback, filter: filter, hid: hid});
				return hid;
			},
		run:	function() {
				var _hooks = this.hooks;
				for ( var i = 0; i < _hooks.length; i++ )
					_hooks[i].run(_hooks[i].filter, _hooks[i].hid, this);
				for ( var _cid in this.members ) {
					if ( this.members[_cid].closed ) {
						this._clearTimeout(_cid);
						this.members[_cid] = null;
						delete this.members[_cid];
					}
				}
			},
		initial:
			function(signalling) {
				var _t = signalling._transport;
				for ( var f in specialFeatures.transports ) {
					if ( specialFeatures.transports[f].indexOf(_t) != -1 &&
					     typeof(specialFeatures.handlers[f].initial) == 'function' &&
					     specialFeatures.transports[f] != null )
						specialFeatures.handlers[f].initial(signalling);
				}
			},
		_push:	function(signalling, msg) {
				if ( signalling.initial() || ! validateMessage(msg, signalling._transport) )
					return;
				if ( ! msg.id ) {
					/* Control message (ping/pong) has 0 id */
					if ( msg.cid == live.userData.id || typeof msg.data != 'object' )
						return;
					switch ( msg.data.command ) {
						case 'ping':
							if ( typeof(specialFeatures.handlers[msg.type].ping) == 'function' )
								specialFeatures.handlers[msg.type].ping(signalling, msg);
							break;
						case 'pong':
							if ( msg.data.dst == live.userData.id && typeof(specialFeatures.handlers[msg.type].pong) == 'function' )
								specialFeatures.handlers[msg.type].pong(signalling, msg);
							break;
					}
					return;
				}
				var _handler = feature._handles[msg.type][msg.id];
				if ( _handler ) {
					if ( _handler.handle(msg) === false )
						delete feature._handles[msg.type][msg.id];
					return;
				} else if ( msg.cid == live.userData.id )
					return;		/* Don't try to construct a handler based on a message of our own. */

				try {
					_handler = specialFeatures.handlers[msg.type].create(signalling, msg, signalling.initial());
				} catch ( e ) {
					console.log(e.message);
					return;
				}
				_handler.handle(msg);
				/* Callback to enabler of feature to tell them */
				if ( typeof specialFeatures.callbacks[msg.type] == 'function' ) 
					specialFeatures.callbacks[msg.type](_handler, signalling.initial());
				feature._handles[msg.type][_handler.get('id')] = _handler;
				return;
			},
		_setTimeout:
			function(cid, ms) {
				if ( ! this.members[cid] || this.members[cid].timeout )
					return;
				var _this = this;
				function timeout() {
					if ( _this.members[cid].transport )
						_this.members[cid].transport.close();
					_this.post({command: 'timeout', dst: cid}, _this.attr.mime);
					_this.members[cid].error = 'Feature timed out waiting for response from ' + cid + '!';
					_this.members[cid].status = 'timeout';
					_this.run();
				}
				this.members[cid].timeout = setTimeout(timeout, ms);
			},
		_clearTimeout:
			function(cid) {
				if ( this.members[cid].timeout )
					clearTimeout(this.members[cid].timeout);
			},
		accept:	function(stream) {
					if ( isMediaStream(stream) )
						this.addStream(stream);
					this.post({command: 'accept'}, this.attr.mime);
					if ( this.attr.cid != live.userData.id )
						this._setTimeout(this.attr.cid, pc._config.timeout);
/* TODO: else set an accept timeout on myself? */
					this.attr.accepted = true;
			},
		reject:	function(cid) {
				if ( cid && feature._status[this.members[cid].status] < feature._status['rejected'] ) {
					if ( feature._status[this.members[cid].status] > feature._status['acknowledged'] ) {
						this.post({command: 'cancel', dst: cid}, this.attr.mime);
						this.members[cid].status = 'cancelled';
					} else if ( feature._status[this.members[cid].status] > feature._status['unknown'] ) {
						this.post({command: 'reject', dst: cid}, this.attr.mime);
						this.members[cid].status = 'rejected';
						this._clearTimeout(cid);
					}
					if ( this.members[cid].transport )
						this.members[cid].transport.close();
				} else if ( ! cid ) {
					for ( var _cid in this.members ) {
						if ( feature._status[this.members[_cid].status] >= feature._status['rejected'] )
							continue;
						if ( feature._status[this.members[_cid].status] > feature._status['acknowledged'] ) {
							this.post({command: 'cancel', dst: _cid}, this.attr.mime);
							this.members[_cid].status = 'cancelled';
						} else if ( feature._status[this.members[_cid].status] > feature._status['unknown'] ) {
							this.post({command: 'reject', dst: _cid}, this.attr.mime);
							this.members[_cid].status = 'rejected';
							this._clearTimeout(_cid);
						}
						if ( this.members[_cid].transport )
							this.members[_cid].transport.close();
					}
				}
				this.run();
			},
		merge:	function() {
				/* No-Op placeholder for 'merge' */
			}
	});

	/* Currently specific to PeerConnection and DataChannel */
	var file = specialFeatures.handlers.file = feature.extend({
		_config:
			{
				acknowledge:	4000,
				timeout:	300000,
				mime:		'file/signal'
			},
		_transports:
			{
				chat:	(typeof(RTCPeerConnection) == 'function' ? pc : null) /* Array here for multiple transports? */
			},
		construct:
			function(signalling, object, initial) {
				if ( ! object.data || ! object.data.replay ) {
					if ( initial )
						throw new Error('Cannot construct file on replayed message!');
					if ( ! (object instanceof File) && (typeof(object) != 'object' || ! object.id || ! object.data) )
						throw new Error('Bad file object!');
					if ( ! (object instanceof File) ) {
						if ( ! object.cid || object.cid == live.userData.id )
							throw new Error('Cannot construct file on own message!');
						if ( ! object.data.command || object.data.command != 'offer' )
							throw new Error('Cannot construct file using command: ' + object.data.command + '!');
					}
				}
				if ( AdapterJS && AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.NONE )
					throw new Error('Temasys plugin cannot do file transfer yet!');
				var _this = this;
				this.attr = {
					id:		object.id || (new Date).getTime(),
					status:		'unknown',
					mime:		file._config.mime,
					cN:		object.cN,
					md5:		object.md5,
					cid:		object.cid,
					name:		object.name,
					type:		null,
					size:		null,
					file:		null,
					timeout:	null,
					party:		'receive',
					signalling:	signalling
				};
				this.hooks = [];
				this.members = {};
				if ( ! file._transports[signalling._transport] )
					throw new Error('Bad file transport!');
				if ( object instanceof File ) {
					var _reader = new FileReader();
					_reader.onloadend = function() {
						var _md5 = new SparkMD5.ArrayBuffer();
						_md5.append(_reader.result);
						_this.attr.md5 = _md5.end();
						_this.offer();
					}
					_reader.readAsArrayBuffer(object);
					this.attr.type = object.type;
					this.attr.size = object.size;
					this.attr.party = 'send';
					this.attr.file = object;
				}
			},
		pre_destroy:
			function() {
console.log('PRE-DESTROY FILE');
				this.attr.status = 'closed';
				this.run();
			},
		validate:
			function() {
				if ( AdapterJS && AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.NONE )
					return false;
				if ( typeof attachMediaStream === 'function' )
					return true;
				return false;
			},
		initial:
			function(signalling) {
/* TODO: Add file support for initial feature action - Typically a ping */
			},
		ping:	function(signalling) {
/* TODO: Add file support for a null-ID PING/PONG exchange */
			},
		pong:	function(signalling) {
/* TODO: Add file support for a null-ID PING/PONG exchange */
			},
		get:	function(attr) {
				if ( attr == 'progress' ) {
					var _progress = {};
					for ( var _cid in this.members ) {
						var _statusNo = feature._status[this.members[_cid].status];
						if ( _statusNo < feature._status['unknown'] || _statusNo > feature._status['acknowledged'] ) {
							_progress[_cid] = {
								status:		this.members[_cid].status,
								progress:	this.members[_cid].progress,
								name:		live.cidCache[_cid].name
							};
						}
					}
					return _progress;
				}
				if ( ! this.attr )
					return null;
				return this.attr[attr];
			},
		update:	function(cid, status, data) {
				switch ( status ) {
					case 'transferring':
						var _progress = Math.round((data / this.attr.size) * 100);
						if ( _progress <= this.members[cid].progress )
							return;
						this.members[cid].progress = _progress;
						break;
					case 'complete':
						if ( data && this.attr.party == 'receive' ) {
							this.attr.file = new Blob(data, {type: this.attr.type});
							this.post({command: 'complete'}, this.attr.mime);
						}
						this.members[cid].progress = 100;
						break;
					case 'error':
						this.members[cid].error = data;
						this.reject(cid);
						break;
					case 'closed':
						this.members[cid].closed = true;
						break;
				}
				if ( status.search(/^(closed|error)$/) == -1 || (status == 'error' && feature._status[this.members[cid].status] < feature._status['rejected']) )
					this.members[cid].status = status;
				this.run();
				if ( Utils.isEmpty(this.members) )
					this.destroy();
			},
		_setup:	function(cid) {
				if ( this.members[cid].transport )
					return true;
				var _this = this;
				function update(cid, status, data, pid) {
					_this.update(cid, status, data, pid);
				}
				try {
					this.members[cid].transport = new av._transports[this.attr.signalling._transport](this, cid, {data: true, size: this.attr.size, md5: this.attr.md5}, update); 
				} catch ( e ) {
					this.update(cid, 'error', e.message);
					return false;
				}
				return true;
			},
		post:	function(data, mime) {
				this.attr.signalling.post({
					data:	data,
					mime:	mime,
					type:	'file',
					id:	this.attr.id,
					name:	this.attr.name
				});
			},
		offer:	function() {
				var _this = this;
				function timeout() {
					_this.update(live.userData.id, 'error', 'Offer timed out waiting for response!');
					_this.run();
				}
				this.post({command: 'offer', size: this.attr.size, type: this.attr.type, md5: this.attr.md5}, this.attr.mime);
				this.attr.timeout = setTimeout(timeout, file._config.acknowledge);
			},
		acknowledge:
			function() {
				this.post({command: 'acknowledge'}, this.attr.mime);
			},
		handle:	function(msg) {
				if ( ! this.attr )
					return false;
				if ( ! msg.mime || ! msg.data )
					return;
				var _memberStatus = null;
				var _status = this.attr.status;
/* TODO Handle replayed file offer */
				if ( msg.cid == live.userData.id && msg.mime == this.attr.mime ) {
					switch( msg.data.command ) {
						case 'offer':
							this.attr.status = 'offered';
							break;
						case 'acknowledge':
							this.attr.status = 'acknowledged';
							break;
						case 'accept':
							if ( ! this.attr.accepted ) {	/* 2 copies of keevio, other party accepted? */
								for ( var _cid in this.members ) {
									if ( this.members[_cid].transport )
										this.members[_cid].transport.close();
								}
								this.attr.status = 'cancelled';
								break;
							}
							delete this.attr.accepted;	/* Allow a replay accept to kick us off if needed */
							this.attr.status = 'accepted';
							break;
					}
				} else if ( msg.cid != live.userData.id ) {
					if ( this.attr.status != 'offered' && msg.cid != this.attr.cid )
						return;
					if ( ! this.members[msg.cid] ) {
						this.members[msg.cid] = {
							status:		'unknown',
							closed:		false,
							transport:	null,
							timeout:	null,
							progress:	0,
							error:		''
						};
					}
					if ( feature._status[this.members[msg.cid].status] < feature._status['unknown'] )
						return;
					_memberStatus = this.members[msg.cid].status;
					if ( msg.mime == this.attr.mime ) {
						if ( this.attr.status == 'offered' ) {
							switch ( msg.data.command ) {
								case 'acknowledge':
									if ( this._setup(msg.cid) )
										this.members[msg.cid].status = 'acknowledged';
									this._setTimeout(msg.cid, file._config.timeout);
									clearTimeout(this.attr.timeout);
									break;
								case 'accept':
									if ( this.members[msg.cid].transport )
										this.members[msg.cid].transport.sendData(this.attr.file);
									this.members[msg.cid].status = 'accepted';
									this._clearTimeout(msg.cid);
									break;
								case 'complete':
									if ( this.members[msg.cid].transport )
										this.members[msg.cid].transport.close();
									break;
								case 'reject':
									if ( msg.data.dst != live.userData.id )
										break;
									if ( this.members[msg.cid].transport )
										this.members[msg.cid].transport.close();
									this.members[msg.cid].status = 'rejected';
									break;
								case 'cancel':
									if ( msg.data.dst != live.userData.id )
										break;
									if ( this.members[msg.cid].transport )
										this.members[msg.cid].transport.close();
									this.members[msg.cid].status = 'cancelled';
									break;
							}
						} else {
							switch ( msg.data.command ) {
								case 'offer':
									this.attr.md5 = msg.data.md5;
									this.attr.size = msg.data.size;
									this.attr.type = msg.data.type;
									if ( this._setup(msg.cid) )
										this.acknowledge();
									this.members[msg.cid].status = 'offered';
									break;
								case 'timeout':
									if ( msg.data.dst != live.userData.id )
										break;
									if ( this.members[msg.cid].transport )
										this.members[msg.cid].transport.close();
									this.members[msg.cid].status = 'timeout';
									break;
								case 'reject':
									if ( msg.data.dst != live.userData.id )
										break;
									if ( this.members[msg.cid].transport )
										this.members[msg.cid].transport.close();
									this.members[msg.cid].status = 'rejected';
									break;
								case 'cancel':
									if ( msg.data.dst != live.userData.id )
										break;
									if ( this.members[msg.cid].transport )
										this.members[msg.cid].transport.close();
									this.members[msg.cid].status = 'cancelled';
									break;
							}
						}
					} else if ( this.members[msg.cid].transport &&  msg.mime == 'transport/signal' ) {
						this.members[msg.cid].transport.handle(msg.data);
						this._clearTimeout(msg.cid);
					}
				}
				if ( (this.members[msg.cid] && this.members[msg.cid].status != _memberStatus) || this.attr.status != _status )
					this.run();
			}
	});

	var av = specialFeatures.handlers.av = feature.extend({
		_config:
			{
				acknowledge:	4000,
				timeout:	60000,
				mime:		'av/webm'
			},
		_transports:
			{
				chat:	(typeof(RTCPeerConnection) == 'function' ? pc : null) /* Array here for multiple transports? */
			},
		_existingdone:
			{},
		construct:
			function(signalling, object, initial) {
				if ( initial )
					throw new Error('Cannot construct av on replayed message!');
				if ( ! isMediaStream(object) && (typeof(object) != 'object' || ! object.id || ! object.data) )
					throw new Error('Bad av object!');
				if ( ! isMediaStream(object) ) {
					if ( ! object.cid || object.cid == live.userData.id )
						throw new Error('Cannot construct av on own ' + object.data.command + ' message!');
					if ( ! object.data.command || object.data.command != 'offer' )
						throw new Error('Cannot construct av using command: ' + object.data.command + '!');
				}
				this.attr = {
					id:		object.id,
					cN:		object.cN,
					cid:		object.cid,
					error:		'',
					party:		'callee',
					status:		'unknown',
					mime:		av._config.mime,
					type:		object.type,
					timeout:	null,
					closing:	false,
					accepted:	false,
					localMedia:	{},
					remoteMedia:	{},
					signalling:	signalling,
					existing:	(object.data && object.data.existing)
				};
				this.hooks = [];
				this.members = {};
				if ( ! av._transports[signalling._transport] )
					throw new Error('Bad video transport!');
				if ( isMediaStream(object) ) {
					if ( object.getVideoTracks().length == 1 ) {
						if ( object.getVideoTracks()[0].label == 'Screen' )
							this.attr.type = 'screen';
						else
							this.attr.type = 'video';
					} else if ( object.getAudioTracks().length == 1 )
						this.attr.type = 'audio';
					else
						throw new Error('No media tracks found!');

					this.attr.localMedia[object.id] = object;
					this.attr.id = (new Date).getTime();
					this.attr.party = 'caller';
					this.offer();
				}
			},
		pre_destroy:
			function() {
console.log('PRE-DESTROY VIDEO', this.attr.id);
				for ( var id in this.attr.localMedia ) {
					this.attr.localMedia[id].onended = null;
					this.removeStream(id);
				}
				this.attr.status = 'closed';
				this.run();
				if ( feature._handles[this.attr.id] === this )
					delete feature._handles[this.attr.id];
			},
		validate:
			function() {
				if ( typeof attachMediaStream === 'function' )
					return true;
				return false;
			},
		/* av support for initial feature action - a ping */
		initial:
			function(signalling) {
				signalling.post({
					data:   {command: 'ping'},
					mime:   av._config.mime,
					type:   'av',
					id:     0
				});
			},
		/* av support for a ping message */
		ping:	function(signalling, msg) {
				var _current = {};
				for ( var id in feature._handles.av ) {
					if ( feature._handles.av[id].attr == null )
						continue;
					if ( feature._handles.av[id].get('closing') )
						continue;
					if ( feature._handles.av[id].get('merge') != null )
						continue;
					if ( feature._handles.av[id].get('signalling') !== signalling )
						continue;
					_current[id] = feature._handles.av[id].get('type');
					var _msg = Utils.doClone(msg);
					_msg.id = id;
					_msg.data.command = 'acknowledge';
					if ( feature._handles.av[id].handle(_msg) === false )
						delete feature._handles.av[id];
				}
				signalling.post({
					data:   {command: 'pong', current: _current, dst: msg.cid},
					mime:   av._config.mime,
					type:   'av',
					id:     0
				});
			},
		/*
		 * av support for a pong message
		 * Create an av handler for each existing conversation,
		 * and pass to frontend callback as new, but with an
		 * 'existing' flag set.
		 */
		pong:	function(signalling, msg) {
				var _handler = null;
				if ( ! msg.data.current || typeof msg.data.current != 'object' )
					return;
				for( var _id in msg.data.current ) {
					_handler = feature._handles.av[_id];
					if ( ! _handler ) {
						if ( av._existingdone[_id] ) {
							signalling.post({
								data:   {command: 'cancel', dst: msg.cid},
								mime:   av._config.mime,
								type:   'av',
								id:     _id
							});
							continue;	/* Already closed/rejected by F/End */
						}
						var _msg = Utils.doClone(msg);
						_msg.id = _id;
						_msg.data.command = 'offer';
						_msg.data.existing = true;
						_msg.data.type = msg.data.current[_id];
						try {
							_handler = av.create(signalling, _msg);
						} catch ( e ) {
							console.log(e.message);
							av._existingdone[_id] = true;
							continue;
						}
						_handler.handle(_msg);
						if ( typeof specialFeatures.callbacks.av == 'function' ) 
							specialFeatures.callbacks.av(_handler);
						feature._handles.av[_handler.get('id')] = _handler;
					} else if ( _handler.get('closing') ) {
						signalling.post({
							data:   {command: 'cancel', dst: msg.cid},
							mime:   av._config.mime,
							type:   'av',
							id:     _id
						});
						av._existingdone[_id] = true;
						continue;	/* Already closed/rejected by F/End */
					}
					av._existingdone[_id] = true;
					var _msg = Utils.doClone(msg);
					_msg.id = _id;
					_msg.data.command = 'acknowledge';
					if ( _handler.handle(_msg) === false )
						delete feature._handles.av[_id];
				}
			},
		get:	function(attr) {
				if ( attr == 'remoteMedia' ) {
					var _remoteMedia = {};
					for ( var _cid in this.members ) {
						if ( ! this.attr.closing )
							_remoteMedia[0 - _cid] = {
								status:	this.members[_cid].status,
								cN:	live.cidCache[_cid].name,
								ended:	this.members[_cid].status == 'closed',
								cid:	_cid
							};
						for ( var _sId in this.members[_cid].media ) {
							_remoteMedia[_sId] = this.members[_cid].media[_sId];
							_remoteMedia[_sId].status = this.members[_cid].status;
							_remoteMedia[_sId].cN = live.cidCache[_cid].name;
							_remoteMedia[_sId].cid = _cid;
							delete _remoteMedia[0 - _cid];
						}
					}
					for ( var x in this.attr.remoteMedia ) {
						if ( x < 0 && _remoteMedia[x] == null && ! this.attr.remoteMedia[x].ended ) {
							_remoteMedia[x] = this.attr.remoteMedia[x];
							_remoteMedia[x].ended = true;
							_remoteMedia[x].status = 'closed';
						}
					}
console.log('get remoteMedia', _remoteMedia);
					this.attr.remoteMedia = Utils.doClone(_remoteMedia);
					return _remoteMedia;
				}
				if ( ! this.attr )
					return null;
				return this.attr[attr];
			},
		update:	function(cid, status, data, pid) {
				switch ( status ) {
					case 'remoteMedia':
						if ( ! data.id )
							data.id = randomString(32);
						if ( ! data.ended && ! this.members[cid].media[data.id] )
							this.members[cid].media[data.id] = data;
						break;
					case 'error':
						this.members[cid].error = data;
						this.reject(cid);
						break;
					case 'closed':
						this.members[cid].closed = true;
						break;
				}
				if ( status != 'remoteMedia' )
					this.members[cid].status = status;
				this.run();
				if ( status == 'remoteMedia' && data.ended && this.members[cid].media[data.id] ) {
					this.members[cid].media[data.id] = null;
					delete this.members[cid].media[data.id];
				}
				if ( Utils.isEmpty(this.members) )
					this.destroy();
			},
		_setup:	function(cid) {
				if ( this.members[cid].transport )
					return true;
				var _this = this;
				function update(cid, status, data, pid) {
					_this.update(cid, status, data, pid);
				}
				try {
					this.members[cid].transport = new av._transports[this.attr.signalling._transport](this, cid, {audio: true, video: true}, update); 
				} catch ( e ) {
					this.update(cid, 'error', e.message);
					return false;
				}
				for ( var _id in this.attr.localMedia ) 
					this.members[cid].transport.addStream(this.attr.localMedia[_id]);
				return true;
			},
		_mediaControl:
			function(tracks, id, action) {
				var _media = {};
				if ( id && ! this.attr.localMedia[id] )
					return false;
				else if ( id && this.attr.localMedia[id] )
					_media[id] = this.attr.localMedia[id];
				else
					_media = this.attr.localMedia;
				for ( var _id in _media ) {
					if ( tracks.audio === true || tracks.audio === false ) {
						var _audio = _media[_id].getAudioTracks();
						for ( var i = 0; i < _audio.length; i++ ) {
							if ( action == 'stop' && tracks.audio && typeof _audio[i].stop == 'function' )
								_audio[i].stop();
							else if ( action == 'mute' )
								_audio[i].enabled = ! tracks.audio;
						}
					}
					if ( tracks.video === true || tracks.video === false ) {
						var _video = _media[_id].getVideoTracks();
						for ( var i = 0; i < _video.length; i++ ) {
							if ( action == 'stop' && tracks.video && typeof _video[i].stop == 'function' )
								_video[i].stop();
							else if ( action == 'mute' )
								_video[i].enabled = ! tracks.video;
						}
					}
				}
				return true;
			},
		addStream:
			function(stream) {
				var _this = this;
				function ended(e) {
					for ( var _cid in _this.members ) {
						if ( ! _this.members[_cid].transport )
							continue;
						_this.members[_cid].transport.removeStream(e.target);
					}
					_this.run();
					if ( _this.attr.localMedia[e.target.id] ) {
						_this.attr.localMedia[e.target.id] = null;
						delete _this.attr.localMedia[e.target.id];
					}
				}
				if ( ! isMediaStream(stream) )
					return false;
				if ( ! stream.id )
					stream.id = randomString(32);
				var _added = true;
				var _localMedia = this.attr.localMedia;
				if ( ! _localMedia[stream.id] ) {
					for ( var _cid in this.members ) {
						if ( ! this.members[_cid].transport )
							continue;
						if ( ! this.members[_cid].transport.addStream(stream) )
							_added = false;
					}
					_localMedia[stream.id] = stream;
					stream.onended = ended;
				}
				return _added;
			},
		removeStream:
			function(id) {
				return this._mediaControl({audio: true, video: true}, id, 'stop');
			},
		mute:	function(tracks, id) {
				return this._mediaControl(tracks, id, 'mute');
			},
		post:	function(data, mime) {
				this.attr.signalling.post({
					data:	data,
					mime:	mime,
					type:	'av',
					id:	this.attr.id
				});
			},
		offer:	function() {
				var _this = this;
				function timeout() {
					_this.attr.status = 'error';
					_this.run();
					_this.close();
				}
				this.post({command: 'offer', type: this.attr.type}, this.attr.mime);
				this.attr.timeout = setTimeout(timeout, av._config.acknowledge);
			},
		acknowledge:
			function() {
// console.log('sending acknowledge, state:', (!this.attr ? 'destroyed' : (this.attr.closing ? 'closing' : 'live')), ', type:', this.attr.type, ', merge:', this.attr.merge);
				if ( ! this.attr || this.attr.closing )
					return;
// console.log('acknowledge with type:', this.attr.type, ', merge:', this.attr.merge);
				if ( this.attr.merge  && this.attr.merge != this.attr.id )
					this.post({command: 'acknowledge', type: this.attr.type, merge: this.attr.merge}, this.attr.mime);
				else
					this.post({command: 'acknowledge'}, this.attr.mime);
			},
		handle:	function(msg) {
				if ( ! this.attr )
{
console.log('expired handler (' + msg.id +')', msg.cid, ' ->', msg.data.dst, msg.mime, msg.data.command, '/', msg.data.type, 'merge:', msg.data.merge, new Date());
					return false;
}
console.log('av handle (' + msg.id +', ' + this.attr.id +')', msg.cid, ' ->', msg.data.dst, msg.mime, msg.data.command, '/', msg.data.type, 'merge:', msg.data.merge, new Date());
				if ( this.attr.closing || ! msg.mime || ! msg.data )
					return;
				if ( msg.id != this.attr.id ) {
					/* A merge-ack that was not the first can be handled */
					if ( msg.cid == live.userData.id || msg.data.command != 'acknowledge' )
						return;
					if ( msg.data.merge != this.attr.id )
						return;
					msg.id = msg.data.merge;
				}
				var _memberStatus = null;
				var _status = this.attr.status;
				if ( msg.cid == live.userData.id && msg.mime == this.attr.mime ) {
					switch( msg.data.command ) {
						case 'offer':
							this.attr.status = 'offered';
							break;
						case 'acknowledge':
							this.attr.status = 'acknowledged';
							for ( var x in this.attr.localMedia ) {
								this.accept();	/* Replay accept because we already have localMedia */
								break;
							}
							break;
						case 'accept':
							if ( ! this.attr.accepted ) {	/* 2 copies of keevio, other party accepted? */
								for ( var _cid in this.members ) {
									if ( this.members[_cid].transport )
										this.members[_cid].transport.close();
								}
								this.attr.status = 'cancelled';
								break;
							}
							delete this.attr.accepted;	/* Allow a replay accept to kick us off if needed */
							this.attr.status = 'accepted';
							break;
					}
				} else if ( msg.cid != live.userData.id ) {
					if ( ! this.members[msg.cid] ) {
						this.members[msg.cid] = {
							status:		'unknown',
							closed:		false,
							transport:	null,
							timeout:	null,
							media:		{},
							error:		''
						};
					}
					if ( feature._status[this.members[msg.cid].status] < feature._status['unknown'] )
						return;
					_memberStatus = this.members[msg.cid].status;
// console.log('av handle for', msg.cid, this.members[msg.cid].status, msg.mime, msg.data.id, msg.data.merge);
					if ( msg.mime == this.attr.mime ) {
						switch ( msg.data.command ) {
							case 'offer':
								if ( this._setup(msg.cid) ) {
									/* Delayed ACK in case a merge request happens */
									var _this = this;
									setTimeout(
										function() {
											_this.acknowledge();
										 }, 1 );
								}
								this.members[msg.cid].status = 'offered';
								this.attr.type = msg.data.type;
								break;
							case 'acknowledge':
								if ( this.attr.status == 'offered' ) {
									this._setTimeout(msg.cid, av._config.timeout);
									clearTimeout(this.attr.timeout);
								}
								if ( this._setup(msg.cid) ) {
									if ( this.members[msg.cid].status == 'unknown' || this.members[msg.cid].status == 'acknowledged' )
										this.members[msg.cid].status = 'acknowledged';
									else if ( ! msg.data.merge )
										this.members[msg.cid].transport.resetStreams();
								}
								if ( msg.data.merge )
									this._domerge(msg);
								break;
							case 'accept':
								/* If the remote user is already >= accepted and <= connected, probably a replay... */
								if ( (this.attr.status == 'offered' || this.attr.status == 'accepted') && this.members[msg.cid].transport )
									this.members[msg.cid].transport.offerAll();
								this.members[msg.cid].status = 'accepted';
								this._clearTimeout(msg.cid);
								break;
							case 'timeout':
								if ( msg.cid != this.attr.cid )
									break;
								if ( msg.data.dst == live.userData.id ) {
									for ( var _cid in this.members ) {
										if ( this.members[_cid].transport )
											this.members[_cid].transport.close();
									}
									this.members[msg.cid].status = 'timeout';
									this.attr.closing = true;
								} else if ( this.members[msg.data.dst] && this.members[msg.data.dst].transport )
									this.members[msg.data.dst].transport.close();
								break;
							case 'reject':
								if ( msg.data.dst != live.userData.id )
									break;
								if ( msg.cid == this.attr.cid ) {
									for ( var _cid in this.members ) {
										if ( this.members[_cid].transport )
											this.members[_cid].transport.close();
									}
									this.attr.closing = true;
								} else if ( this.members[msg.cid].transport )
									this.members[msg.cid].transport.close();
								this.members[msg.cid].status = 'rejected';
								break;
							case 'cancel':
								if ( msg.data.dst != live.userData.id )
									break;
								if ( this.members[msg.cid].transport )
									this.members[msg.cid].transport.close();
								this.members[msg.cid].status = 'cancelled';
								break;
						}
					} else if ( this.members[msg.cid].transport && msg.mime == 'transport/signal' ) {
						this.members[msg.cid].transport.handle(msg.data);
						this._clearTimeout(msg.cid);
					}
				}
				if ( (this.members[msg.cid] && this.members[msg.cid].status != _memberStatus) || this.attr.status != _status )
					this.run();
			},
		merge:	function(into) {
			/* Support for responding to an offer with a 'renumber' */
// console.log('merge');
				var _this = this;
				if ( this.constructor === into.constructor ) {
// console.log('merge divert set ', this.attr.id, '->', into.get('id'));
					this.attr.merge = into.get('id');
					this.attr.type = into.get('type');
					this.acknowledge();			/* Send an ack with a merge/type attribute set */
				}
				/* Custom cleanup here for merge() */
				for ( var _cid in this.members ) {
					this._clearTimeout(_cid);
					this.members[_cid].state = 'rejected';
					if ( this.members[_cid].transport )
						this.members[_cid].transport.close();
				}
				this.close(true);
			},
		_domerge:
			function(msg) {
// console.log('ack with merge received', msg.id, '->', msg.data.merge);
				/* We are being told to merge into this conversation */
				if ( this.attr.id == msg.data.merge )
					return;
				if ( feature._handles.av[msg.data.merge] && feature._handles.av[msg.data.merge].attr != null ) {
// console.log('Bailing from merge attempt');
					this.close();
					this.run();
					return;
				}

				/* Handle requested,current chat mismatches */
				var _oldId = this.attr.id;
				switch ( this.attr.type + ',' + msg.data.type ) {
					case 'video,video':
					case 'video,audio':
					case 'audio,video':
					case 'audio,audio':
					case 'screen,video':
// console.log('merge OK ', this.attr.type, ' into ', msg.data.type);
						this.attr.id = msg.data.merge;
						this.attr.type = msg.data.type;
						this.acknowledge();
						break;
					case 'video,screen':
					case 'audio,screen':
					case 'screen,screen':
// console.log('merge OK ', this.attr.type, ' into ', msg.data.type);
						this.attr.id = msg.data.merge;
						this.attr.type = msg.data.type;
						this.attr.party = 'callee';
						for ( var id in this.attr.localMedia ) {
							this.attr.localMedia[id].onended = null;
							this.removeStream(id);
						}
						this.acknowledge();
						break;
					case 'screen,audio':
// console.log('merge MESSY! ', this.attr.type, ' into ', msg.data.type);
// console.log('about to lose members:', this.members);
// console.log('not actually losing', msg.cid);	/* TODO: Facke ACK for the rest */
						this.close();
						this.run();

						var _signalling = this.attr.signalling;
						var _msg = Utils.doClone(msg);
						_msg.id = msg.data.merge;
						_msg.data.command = 'offer';
						delete _msg.data.merge;
						var _handler = feature._handles.av[_msg.id];
						if ( _handler )
// {
// console.log('Already have a merge handler! Bad!');
							return;
// }
						try {
							_handler = specialFeatures.handlers[msg.type].create(_signalling, _msg, _signalling.initial());
						} catch ( e ) {
							console.log(e.message);
							return;
						}
						feature._handles.av[_msg.id] = _handler;
						feature._handles.av[_oldId] = feature._handles.av[_msg.id];	
						feature._handles.av[_oldId].attr.merge = feature._handles.av[_oldId].attr.id;
						setTimeout(
							function() {
								/* Old reference killed after 5 seconds */
								delete feature._handles.av[_oldId];
							}, 5000);

						setTimeout(
							function counteroffer() {
console.log('PUSHING REPLACEMENT', _msg);
								/* Send a fake 'replacement' offer */
								_handler.handle(_msg);
								/* Callback to enabler of feature to tell them */
								if ( typeof specialFeatures.callbacks[_msg.type] == 'function' ) 
									specialFeatures.callbacks[_msg.type](_handler, _signalling.initial());
							}, 1000);
						return;
					default:
console.log('merge FAIL ', this.attr.type, ' into ', msg.data.type);
/* TODO: Post in a replacement fake offer from the ID */
						this.close();
						this.run();
						return;
				}
				feature._handles.av[msg.data.merge] = this;
				setTimeout(
					function() {
						/* Old reference killed after 5 seconds */
						delete feature._handles.av[_oldId];
					}, 5000);
				this.members[msg.cid].status = 'offered';
			},
		close:	function(noreject) {
				var _this = this;
				this.attr.closing = true;
				if ( Utils.isEmpty(this.members) ) {
					setTimeout(
						function() {
							_this.destroy();
						}, 1);
				} else {
					setTimeout(
						function() {
							if ( ! noreject )
								_this.reject();
							if ( Utils.isEmpty(_this.members) )
								_this.destroy();
						}, 1);
				}
			}
	});

	var room = Api.extend( /** @lends IPCortex.PBX.room.prototype */ {
			_transport: 'chat',
			/**
			 * Create a new room when notified via tmpld.pl
			 * @constructs IPCortex.PBX.room
			 * @augments Api
			 * @param {Number} id Contact ID to talk to.
			 * @param {Number} roomid Id number of room for this chat.
			 * @protected
			 */
			construct:
				function(id, roomid) {
					this.attr = {
							id:		id,
							key:		null,
							state:		'new',
							msgs:		[],
							linked:		[],
							joined:		[],
							members:	{},
							members_ready:	{},
							roomID:		roomid,
							roomName:	null,
							roomData:	null,
							name:		null,
							xmppid:		null,
							pushed:		0,
							seen:		0
					};
					this.hooks = [];
					this.mhooks = {}; /* Onward hooks we're created for this room's member's states */
					if ( id < 0 && live.xmppRoster[-id] ) {
						this.attr.name = live.xmppRoster[-id].n || live.xmppRoster[-id].d;
						this.attr.xmppid = live.xmppRoster[-id].d;
					} else if ( id > 0 ) {
						this.attr.name = getUser(id).name;
						this.attr.xmppid = id;
					} else
						console.log('ERROR: Got a room with no identifiable name!');
				},
			pre_destroy:
				function() {
					for ( var x in this.mhooks )
						unHook(this.mhooks[x]);
					this.mhooks = {};
				},
			initial:
				function() {
					return (cH.initial == 1);
				},
			/**
			 * @name chatInvite
			 * Invite an external person (no contact) to chat.
			 * If successful, notification arrives through the {@link Callback~chatCB} callback.
			 * Both the local user and the remote party are 'link'ed to the new room
			 * The local user is 'join'ed to the new room.
			 * @param {Object} contact External contact details {name, email, mobile, invite} to start communicating with
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * @static
			 */
			/**
			 * Request a new chat room be created.
			 * If successful, notification arrives through the {@link Callback~chatCB} callback.
			 * Both the local user and the remote party are 'link'ed to the new room
			 * The local user is 'join'ed to the new room.
			 * This method is accessed via IPCortex.PBX.contact.chat() or statically as IPCortex.PBX.chatInvite()
			 * @param {Number|Object|Array} contact Contact ID, list of contacts or external {name, email, mobile, invite} to start communicating with
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * @private
			 * @static
			 */
			requestNew:
				function(contact, callback) {
					var _name = '';
					function result(txt) {
						var _match;
						txt = (txt||'').replace(/(\n|\r)/gm,"");
						if ( contact instanceof Object )
							if ( (_match = txt.match(/<response.*result="success".*id="(\d+)".*uname="([^"]+)"/)) != null )
								live.cidCache[_match[1]] = {name: contact.name, email: contact.email, uname: _match[2], state: 'offline'};
						if ( typeof callback == 'function' )
							Api._result(callback, txt)
					}
					if ( Array.isArray(contact) ) {			/* Internal chat multiroom request */
						for ( var i = 0; i < contact.length; i++ ) {
							if ( ! lookUp.cnt[contact[i]] )
								return PBXError.CHAT_INVALID_CONTACT;
							if ( i == live.userData.id )
								contact.splice(i--, 1);
						}
						_name = '@' + live.userData.id + ',Chat Room';
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
								'cmd=createmulti&type=room' +
								'&ids=' + (contact.join(',')) +
								'&autoclean=60', result);
					} else if ( !(contact instanceof Object) ) {			/* Internal chat contact request */
						if ( contact < live.userData.id )
							_name = contact + '||' + live.userData.id + '|ocm' + live.userData.id;
						else
							_name = live.userData.id + '|ocm' + live.userData.id + '|' + contact + '|';
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
								'cmd=create&type=room&name=' + _name + 
								'&id=' + (contact < 0 ? live.adminID : contact) + 
								'&autoclean=60', result);
					} else {				/* External contact ID request */
						if ( contact.roomID && lookUp.room[contact.roomID] )
							return lookUp.room[contact.roomID].add(contact, callback);
						if ( contact.email && contact.email.match(/^.+@[0-9a-zA-Z\.\-]+$/) == null )
							return PBXError.CHAT_INVALID_EMAIL;
						if ( contact.mobile && contact.mobile.match(/^(\+|0|00|)[1-9][0-9]{6}[0-9]+$/) == null )
							return PBXError.CHAT_INVALID_MOBILE;
						if ( contact.name.match(/^[0-9a-zA-Z '\-\.]+$/) == null )
							return PBXError.CHAT_INVALID_CONTACT;
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
								'cmd=createext&type=room' +
								'&email=' + (contact.email || '') +
								'&mobile=' + (contact.mobile || '') +
								'&name=' + contact.name +
								'&invite=' + (!!contact.invite ? 'true' : '') +
								'&autoclean=60', result);
					}
					return PBXError.OK;
				},
			/**
			 * Getter for room data ( [remote contact]id, key, state, linked, joined, roomID, roomName, [display]name, msgs, [is]multi)
			 * @param {String|Number} attr Key for data to get.
			 * @returns {*} Attribute value
			 */
			get:	function(attr) {
					if ( attr == 'msgs' ) {
						var _msgs = [];
						while ( this.attr.msgs.length ) {
							var _msg = this.attr.msgs.shift();
							if ( _msg.cN == 'SYSTEM' )
								continue;
							_msg.own = false;
							if ( _msg.cID == live.userData.id )
								_msg.own = true;
							if ( getUser(_msg.cID) )
								_msg.cN = getUser(_msg.cID).name;
							_msgs.push(_msg);
						}
						return _msgs;
					}
					if ( attr == 'multi' )
						return ( this.attr.linked.length > 2 || this.attr.roomName.substr(0,1) == '@' );
					if ( attr == 'owner' ) {
						if ( this.attr.roomName.substr(0,1) != '@' || this.attr.roomName.substr(0,2) == '@,' )
							return null;
						return (this.attr.roomName.split(',')[0].substr(1)) - 0;
					}
					return this.attr[attr];
				},
			/**
			 * Modify a room. This is only possible on a multi-contact room and can currently
			 * only modify the room name.
			 * @param {Object} roomdata Object containing attributes top update ('name', 'gomulti');
			 */
			modify:
				function(roomdata) {
					if ( ! roomdata )
						return PBXError.OK;
					if ( roomdata.name.match(/^[0-9a-zA-Z '\-\.]+$/) == null)
						return PBXError.CHAT_INVALID_RNAME;
					if ( this.attr.roomName.substr(0,1) != '@' && ! roomdata.gomulti ) {
						this.attr.roomData = roomdata;
						return PBXError.OK;
					}
					if ( this.attr.roomName.substr(0,1) == '@' ) {
						if ( this.attr.roomName.substr(0,1).split(',')[1] == roomdata.name )
							return PBXError.OK;
					}
					if ( roomdata.gomulti || (roomdata.name && roomdata.name != this.attr.name) ) {
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 
								'cmd=modify&type=room' + 
								'&roomID=' + this.attr.roomID +
								'&name=' + encodeURIComponent(roomdata.name) + 
								'&gomulti=' + (!!roomdata.gomulti ? 'true' : 'false'));
						this.attr.roomData = null;
					}
					return PBXError.OK;
				},
			_stateup:
				function(filter, hid, member) {
					var _this = filter.me;
					var id = member.get('xmppid');
					if ( ! id )
						return;
					if ( id.indexOf('@') != -1 )
						id = live.adminID
					if ( ! _this.attr.members[id] )
						return;
					var state = member.get('show') || 'offline';
					var desc = member.get('desc') || 'Offline';
					var states = member.get('states') || {};
					if ( states['ocm' + id] ) {
						state = states['ocm' + id].show || 'offline';
						desc = states['ocm' + id].desc || 'Offline';
					}
					if ( _this.attr.members[id].state != state ) {
						_this.attr.members[id].state = state;
						_this.attr.members[id].desc = desc;
						if ( _this.attr.members_ready )
							_this.run();
					}
				},
			/**
			 * Request the user name, uName and email of all contact IDs linked in this room.
			 * The response may not be instant as the API may not have the data cached if a temporary
			 * ID was created by another user.
			 * @param {Callback~roomCB} hook The callback function for the response object.
			 * @private
			 */
			_members:
/* pass linked in check if changed */
				function(_newlinked) {
					var _this = this;
					var _need = [];
					var _result = {};

					if ( _newlinked.length == this.attr.linked.length && _newlinked.sort().join(',') == this.attr.linked.sort().join(',') )
						return;

					function get_desc(stat) {
						return (xmpp._show[stat] || {}).desc || 'Offline';
					}
					function result(txt) {
						_result = _result || _this.attr.members;
						var _match;
						txt = (txt||'').replace(/(\n|\r)/gm,"");
						while ( txt.length && _need.length ) {
							var _r = new RegExp('<contact id="' + _need[0] + '">(.*?)</contact>');
							if ( (_match = txt.match(_r)) ) {
								var _data = _match[1];
								_result[_need[0]] = _result[_need[0]] || {state: 'offline', desc: 'Offline'};
								if ( (_match = _data.match(/uname="(.*?)"/)) ) {
									_result[_need[0]].uname = _match[1];
									_result[_need[0]].url = live.inviteUrl + _match[1];
								}
								if ( (_match = _data.match(/name="(.*?)"/)) )
									_result[_need[0]].name = _match[1];
								if ( (_match = _data.match(/email="(.*?)"/)) )
									_result[_need[0]].email = _match[1];
								if ( (_match = _data.match(/show="(.*?)"/)) ) {
									_result[_need[0]].state = _match[1];
									_result[_need[0]].desc = get_desc(_match[1]);
								}
							}
							_need.shift();
						} 
						if ( _need.length == 0 )
							_this.attr.members_ready = true;
						/* Get latest presence state for all contacts and add to result */
						for ( var x in _result ) {
							live.cidCache[x] = _result[x];	/* by reference so will be updated */
							if ( _this.mhooks[x] )
								continue;
							if ( x == live.adminID ) {
								_result[x].state = lookUp.xmpp['Custom/' + _result[x].email].get('show') || 'offline';
								_result[x].desc = lookUp.xmpp['Custom/' + _result[x].email].get('desc') || 'Offline';
								_this.mhooks[x] = lookUp.xmpp['Custom/' + _result[x].email].hook(_this._stateup, {me: _this, id: _this.attr.roomID});
							} else if ( x > 0 && lookUp.xmpp['Custom/' + x]) {
								_result[x].state = lookUp.xmpp['Custom/' + x].get('show') || 'offline';
								_result[x].desc = lookUp.xmpp['Custom/' + x].get('desc') || 'Offline';
								_this.mhooks[x] = lookUp.xmpp['Custom/' + x].hook(_this._stateup, {me: _this, id: _this.attr.roomID});
							} else if ( x > 0 && _result[x].uname ) {
								_result[x].state = _result[x].state || 'offline';
								_result[x].desc = get_desc(_result[x].state);
								_this.mhooks[x] = hookXmpp('Custom/' + x, _this._stateup, {me: _this, id: _this.attr.roomID});
								/* Prime the temp xmpp entry's state */
								lookUp.xmpp['Custom/' + x].set('show', _result[x].state);
								lookUp.xmpp['Custom/' + x].set('desc', _result[x].desc);
							}
						}
						/* kill old hooks */
						for ( var x in _this.mhooks ) {
							if ( _this.mhooks[x] < 0 )
								delete _this.mhooks[x];
							else if ( _newlinked.indexOf(x - 0) == -1 ) {
								unHook(_this.mhooks[x]);
								delete _this.mhooks[x];
							}
						}
						/* kill old results */
						for ( var x in _result ) {
							if ( _newlinked.indexOf(x - 0) == -1 )
								delete _result[x];
						}
						if ( _this.attr.members_ready ) {
							_this.attr.members = Utils.doClone(_result);	/* Need to clone so that a destroy() call does not empty out the cache! */
							_this.run();
						}
					}
					for ( var i = 0; i < _newlinked.length; i++ ) {
						var _id = _newlinked[i];
						if ( _id == live.adminID )
							_id = this.attr.id;
						var _u = getUser(_id);
						if ( live.cidCache[_id] ) {
							_result[_id] = live.cidCache[_id];
						} else if ( this.attr.members[_id] ) {
							_result[_id] = this.attr.members[_id];
						} else if ( _u ) {
							_result[_id] = {name: _u.name, email: _u.email, state: 'offline', desc: 'Offline'};
							if ( ! lookUp.cnt[_id] && ! lookUp.xmpp['Custom/' + _id] )
								_need.push(_id); /* For state info */
						} else if ( this.attr.id && this.attr.id < 0 && live.xmppRoster[0 - _id] ) {
							_result[live.adminID] = {name: live.xmppRoster[-_id].n || live.xmppRoster[-_id].d, email: live.xmppRoster[0 -_id].d};
						} else {
							_need.push(_id);
							_result[_id] = {name: 'Unknown', email: '', state: 'offline', desc: 'Offline'};		/* Fake the result for now */
						}
					}
					_this.attr.members_ready = false;
					if ( _need.length > 0 )
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 
								'cmd=link&type=names' + 
								'&list=' + _need.join(','), result);
					result();
				},
			/**
			 * Run all hooks for this room
			 * @private
			 */
			run:	function() {
					var _hooks = this.hooks;
					for ( var i = 0; i < _hooks.length; i++ )
						_hooks[i].run(_hooks[i].filter, _hooks[i].hid, this);
				},
			/**
			 * Add a new hook to this room
			 * @param {Callback~roomCB} hook The callback function for running this hook
			 * @param {Object} filter Describes the filter used to generate this hook {roomID: roomID}
			 * @param {Number} hid Hook ID number, passed to hook as 2nd parameter
			 * @private
			 */
			/**
			 * Remove a hook from this room
			 * @param {Number} hid Hook ID number to remove
			 * @private
			 */
			/**
			 * Called to query the state of the room for updates
			 * @return {Bool} true: Room changed or has msgs waiting, false: Room unchanged or state == dead.
			 * @private
			 */
			update:	function() {
					var _state = this.attr.state;
					var _oName = this.attr.name;
					var _rName = this.attr.roomName.split('|');
					var _time = Math.floor(new Date().getTime() / 1000);
					if ( _state == 'new' && (_rName.length > 1 || _rName[0].substr(0, 1) == '@') ) {
						if ( cH.roomCB )
							cH.roomCB(this, this.initial());
						else
							cH.rooms.push(this);
					}
					if ( _rName[0].substr(0, 1) == '@' ) {
						this.attr.name = _rName[0].split(',')[1];
						if ( this.attr.roomData && this.attr.roomData.name && this.attr.roomData.name != this.attr.name ) {
							Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 
									'cmd=modify&type=room' + 
									'&roomID=' + this.attr.roomID +
									'&name=' + encodeURIComponent(this.attr.roomData.name));
							this.attr.roomData.name = null;
						}
					}
					if ( this.attr.state != 'dead' ) {
						if ( (this.attr.update + 5) < _time )
							this.attr.state = 'dead';
						else if ( this.attr.linked.length > 1 && this.attr.joined.length < 2 && (this.attr.joined[0] == live.userData.id || this.attr.joined[1] == live.userData.id) )
							this.attr.state = 'invited';
						else if ( this.attr.linked.length < 2 )
							this.attr.state = 'closed';
						else if ( _rName[1] == '' || _rName[3] == '' )
							this.attr.state = 'inviting';
						else
							this.attr.state = 'open';
					}
					if ( this.attr.state == 'dead' && _state == 'dead' ) {
						this.destroy();
						return false;
					}
					if ( _oName != this.attr.name )
						return true;
					if ( this.attr.state != _state || (this.attr.roomName.search(/^_\d+_$/) == -1 && this.attr.msgs.length) )
						return true;
					return false;
				},
			/**
			 * Post a message to the chat server
			 * @param {String} msg Message string
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 */
			post:	function(msg, callback) {
					if ( typeof msg != 'string' ) {
						if ( ! validateMessage(msg, this._transport) )
							return;
						var res = 'ipc-' + msg.type + ':';
						res += (msg.mime || 'application/octet-stream') + ';base64,';
						res += base64encode(JSON.stringify({id: msg.id, data: msg.data, name: (msg.name || '')}));
						msg = res;
					}
					var _this = this;
					function result(txt) {
						if ( callback )
							_this._result(callback, txt)
					}
					if ( this.attr.roomName.substr(0, 1) != '@' ) {
						this.link();	/* No-Op most of the time - For 1-2-1, re-activate other party */
						this.join();	/* No-Op most of the time - Grab/rename 1-2-1 room */
					}
					Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 
							'cmd=post' + 
							'&key=' + this.attr.key +
							'&roomID=' + this.attr.roomID +
							'&msg=' + encodeURIComponent(msg), result);
				},
			sendfile:
				function(data) {
					var _handler = file.create(this, data);
					if ( _handler )
						feature._handles.file[_handler.get('id')] = _handler;
					return _handler;
				},
			videochat:
				function(stream) {
					var _handler = av.create(this, stream);
					if ( _handler )
						feature._handles.av[_handler.get('id')] = _handler;
					return _handler;
				},
			/**
			 * Add a user to a room, making it a multi-room if we go over 2 contacts, and
			 * immediately if the added user is 'external'.
			 * @param {Number|Object} contact Contact ID or external {name, email, mobile, invite} to start communicating with
			 */
			add:	function(contact, callback) {
					if ( !(contact instanceof Object) )
						return this.link(contact, callback);
					if ( contact.email && contact.email.match(/^.+@[0-9a-zA-Z\.\-]+$/) == null )
						return PBXError.CHAT_INVALID_EMAIL;
					if ( contact.mobile && contact.mobile.match(/^(\+|0|00|)[1-9][0-9]{6}[0-9]+$/) == null )
						return PBXError.CHAT_INVALID_MOBILE;
					if ( contact.name.match(/^[0-9a-zA-Z '\-\.]+$/) == null )
						return PBXError.CHAT_INVALID_CONTACT;
					function result(txt) {
						var _match;
						txt = (txt||'').replace(/(\n|\r)/gm,"");
						if ( (_match = txt.match(/<response.*result="success".*id="(\d+)".*uname="([^"]+)"/)) != null )
							live.cidCache[_match[1]] = {name: contact.name, email: contact.email, uname: _match[2], state: 'offline'};
						if ( typeof callback == 'function' )
							Api._result(callback, txt)
					}
					Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
							'cmd=linkext&type=room' +
							'&email=' + (contact.email || '') +
							'&mobile=' + (contact.mobile || '') +
							'&name=' + contact.name +
							'&invite=' + (!!contact.invite ? 'true' : '') +
							'&roomID=' + this.attr.roomID, result);
					return PBXError.OK;
				},
			/**
			 * Link remote party to a room.
			 * @private
			 */
			link:	function(cid, callback) {
					cid = cid || this.attr.id;
					/* Do not (re-)link if offline! */
					if ( cid < 0 ) {
						if ( live.xmppRoster[0 - cid] && (! lookUp.xmpp['Custom/' + live.xmppRoster[0 - cid].d] || ! lookUp.xmpp['Custom/' + live.xmppRoster[0 - cid].d].get('online')) )
							return PBXError.CHAT_USER_OFFLINE;
						cid = live.adminID;
					} else {
						if ( ! lookUp.xmpp['Custom/' + cid] || ! lookUp.xmpp['Custom/' + cid].get('online') )
							return PBXError.CHAT_USER_OFFLINE;
					}
					if ( Utils.isInArray(this.attr.linked, cid) )
						return PBXError.CHAT_ALREADY_LINKED;
					function result(txt) {
						if ( typeof callback == 'function' )
							Api._result(callback, txt)
					}
					Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
							'cmd=link&type=room' +
							'&id=' + cid +
							'&roomID=' + this.attr.roomID, result);
					return PBXError.OK;
				},
			/**
			 * Join local user to a room. A user must be joined to a room before they can receive messages.
			 * It is how a request to chat is accepted.
			 */
			join:	function() {
					if ( Utils.isInArray(this.attr.joined, live.userData.id) ) {
						var _resource = 'ocm' + live.userData.id;
						var _rName = this.attr.roomName.split('|');
						if ( _rName[1] == _resource || _rName[3] == _resource || _rName[0].substr(0, 1) == '@' )
							return PBXError.CHAT_ALREADY_JOINED;
					}
					Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
							'cmd=join' +
							'&roomID=' + this.attr.roomID);
					return PBXError.OK;
				},
			/**
			 * Leave (un-join) local user from a room. But do not unlink
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 */
			unjoin:	function(callback) {
					var _this = this;
					function result(txt) {
						_this._result(callback, txt)
					}
					var _leave = false;
					var _resource = 'ocm' + live.userData.id;
					var _rName = this.attr.roomName.split('|');
					if ( _rName[0] == live.userData.id && (_rName[1] == _resource || _rName[1] == '') )
						_leave = true;
					else if ( _rName[2] == live.userData.id && (_rName[3] == _resource || _rName[3] == '') )
						_leave = true;
					else if ( _rName[0] == '_' + live.userData.id + '_' )
						_leave = true;
					else if ( _rName[0].substr(0, 1) == '@' ) /* TODO: isIn joined? */
						_leave = true;
					if ( _leave )
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
								'cmd=unjoin' +
								'&key=' + this.attr.key + 
								'&roomID=' + this.attr.roomID, result);
					else if ( typeof callback == 'function' )
						callback(false, '');
				},
			/**
			 * Leave (un-join) local user from a room. This also unlinks the user, effectively closing the room.
			 * It is how a chat room is closed.
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 */
			leave:	function(callback) {
					var _this = this;
					function result(txt) {
						if ( _this && _this.attr )
							_this.attr.pushed = 0;
						_this._result(callback, txt)
					}
					var _leave = false;
					var _resource = 'ocm' + live.userData.id;
					var _rName = this.attr.roomName.split('|');
					if ( _rName[0] == live.userData.id && (_rName[1] == _resource || _rName[1] == '') )
						_leave = true;
					else if ( _rName[2] == live.userData.id && (_rName[3] == _resource || _rName[3] == '') )
						_leave = true;
					else if ( _rName[0] == '_' + live.userData.id + '_' )
						_leave = true;
					else if ( _rName[0].substr(0, 1) == '@' ) /* TODO: isIn joined or linked? */
						_leave = true;
					if ( _leave )
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
								'cmd=leave' +
								'&key=' + this.attr.key + 
								'&roomID=' + this.attr.roomID, result);
					else if ( typeof callback == 'function' )
						callback(false, '');
				},
			/**
			 * Break inbound special message into component parts for internal use.
			 * @private
			 */
			_msgdecode:
				function(msg, match) {
					var _msg = {
						type:		match[1],
						cN:		msg.cN,
						cid:		msg.cID,
						mime:		match[2],
						encoding:	'base64'
					};
					var _body = null;
					try {
						_body = JSON.parse(base64decode(match[3]));
					} catch ( e ) {
						console.log('Error decoding special message:', e);
						return false;
					}
					if ( ! _body || typeof(_body) != 'object' || _body.id == null ) {
						console.log('unhandled message content ', match[3]);
						return false;
					}
					_msg.id = _body.id;
					_msg.data = _body.data;
					_msg.name = _body.name;

					return _msg;
				},
			/**
			 * Add a message to the room's message queue (inbound from server)
			 * If it is a formatted message, hand it off to the right handler.
			 * @param {String} msg The message to add.
			 * @private
			 */
			push:	function(msg) {
					/* Dropping dupe or unordered message id */
					if ( msg.msgID <= this.attr.pushed )
						return;
					this.attr.pushed = msg.msgID;
					var _tmp = msg.msg.match(/^ipc-(\w+):([\w\-]+\/[\w\-]+);base64,(.*)$/);
					if ( ! Array.isArray(_tmp) ) {
						this.attr.msgs.push(msg);
						return;
					}

					var _msg = room._msgdecode(msg, _tmp);
					if ( _msg !== false )
						feature._push(this, _msg);
				},
			/**
			 * Flush the message queue for this room.
			 * @private
			 */
			clear:	function() {
					this.attr.msgs = [];
				}
		});


	var call = Api.extend( /** @lends IPCortex.PBX.call.prototype */ {
			/**
			 * Create a new call when notified via tmpld.pl
			 * @constructs IPCortex.PBX.call
			 * @augments Api
			 * @param {String} id Call unique asterisk id 
			 * @param {String} cid Call id, unique per device
			 * @param {IPCortex.PBX.device} device Device instance the call is on
			 * @param {String} callerid callerID for local end of the call
			 * @todo is the detail for callerid correct???
			 * @protected
			 */
			construct: function(id, cid, device, callerid) {
				this.attr = {
						start:		null,
						end:		null,
						inq:		null,
						outq:		null,
						dial:		null,
						state:		null,
						party:		null,
						session:	null,
						nrstate:	null,
						brstate:	null,
						stamp:		(new Date()).getTime(),
						id:		id,
						cid:		cid,
						brcid:		false,
						device:		device,
						srcId:		'',
						extension:	'',
						extname:	'',
						number:		'',
						name:		'Calling...',
						uid:		new Number(Api._private.uid)
				};
				Api._private.uid++;
			},
			/**
			 * Fetch data about the call. Also allows 'features' to be fetched from the device this call is on.
			 * @param {String} [attr] Key for data to get.
			 * __id__: Unique call ID
			 * __stamp__: Call creation time
			 * __start__: Call start time
			 * __end__: Call end time
			 * __inq__: Queued call - time into Queue
			 * __outq__: Queued call - time out of Queue
			 * __name__: Caller name, or best we have so far
			 * __number__: Caller number, or best indication we have so far
			 * __extension__: The extension the call was originally sent to
			 * __extname__: The extension name the call was originally sent to
			 * __nrState__: Near end state, one of - null, 'down', 'dialing', 'ring', 'ringing', 'park', 'hold'
			 * __brState__: Bridge state, one of - null, 'down', 'dialing', 'ring', 'ringing', 'park', 'hold'
			 * __state__: Combination of nrState and brState, one of - 'down', 'dial', 'call', 'ring', 'up', 'park', 'hold'
			 * __party__: 'caller' or 'callee'
			 * __device__: Reference to the parent device for this call
			 * __features__: Indication of supported device features (answer|hold|talk) as a comma separated list.
			 * @returns {*} Attribute value
			 */
			get:	function(attr) {
				if ( attr == 'features' )
					return this.attr.device.get('features');
				return this.attr[attr];
			},
			/**
			 * Bridge two calls in an attended transfer. One call is "this" call, the other is as described by the paramaters.
			 * @param {String} cid Destination Call id, unique per device
			 * @param {String} device Device that cid is found on.
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 */
			atxfer:	function(cid, device, callback) {
				var _this = this;
				function result(txt) {
					_this._result(callback, txt)
				}
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 
						'cmd=attended' + 
						'&attended=' + this.attr.cid +
						'&device=' + this.attr.device.get('device') +
						'&dest=' + cid +
						'&ddevice=' + device, result);
			},
			/**
			 * Blind transfer this call to a number
			 * @param {String} number Destination number for blind transfer
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 */
			xfer:	function(number, callback) {
				var _this = this;
				function result(txt) {
					_this._result(callback, txt)
				}
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 
						'cmd=transfer' + 
						'&transfer=' + this.attr.cid +
						'&number=' + number +
						'&device=' + this.attr.device.get('device'), result);
			},
			/**
			 * Hangup this call
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 */
			hangup:	function(callback) {
					var _this = this;
					if ( ! this.attr )
						return;	/* Closing but UI is lagged */
					function result(txt) {
						_this._result(callback, txt)
					}
					if ( this.attr.session ) {
						if ( ! this.attr.session.isEnded() )
							this.attr.session.terminate();
					} else {
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 
								'cmd=hangup' + 
								'&hangup=' + this.attr.cid +
								'&device=' + this.attr.device.get('device'), result);
					}
				},
			/**
			 * Un-hold (if held) or answer (if ringing) this call
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 */
			talk:	function(callback) {
					var _this = this;
					function result(txt) {
						_this._result(callback, txt)
					}
					if ( this.attr.session ) {
						if ( this.attr.nrstate == 'ringing' ) {
							this.attr.device._holdexcept(this.attr.session);
							this.attr.session.answer({mediaConstraints: {audio: true, video: false}});
						} else if ( typeof(this.attr.session.unhold) == 'function' && this.attr.session.isOnHold().local ) {
							this.attr.device._holdexcept(this.attr.session);
							this.attr.session.unhold();
						}
					} else {
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
								'cmd=talkhold' +
								'&hold=talk' +
								'&call=' + this.attr.cid + 
								'&device=' + this.attr.device.get('device'), result);
					}
				},
			/**
			 * Put this call on hold.
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 */
			hold:	function(callback) {
					var _this = this;
					function result(txt) {
						_this._result(callback, txt)
					}
					if ( this.attr.session ) {
						if ( typeof(this.attr.session.hold) == 'function' && ! this.attr.session.isOnHold().local )
							this.attr.session.hold();
					} else {
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
								'cmd=talkhold' +
								'&hold=hold' +
								'&call=' + this.attr.cid + 
								'&device=' + this.attr.device.get('device'), result);
					}
				},
			/**
			 * Mute or unmute a JsSIP call. An error is returned for non-JsSIP calls.
			 * @param {Bool} mute true: mute the call, false: unmute the call.
			 * @param {Function} [callback] Optional callback called with an error code if fails
			 */
			mute:	function(mute, callback) {
					if ( callback && typeof(callback) != 'function' )
						return;
					if ( ! this.attr.session )
						return callback ? callback(PBXError.MUTE_NO_SESSION) : null;
					if ( typeof(mute) != 'boolean' )
						return callback ? callback(PBXError.MUTE_INVALID_REQUEST) : null;
					if ( mute )
						this.attr.session.mute();
					else
						this.attr.session.unmute();
				},
			dtmf:	function(tone, callback) {
					if ( typeof(callback) != 'function' )
						return;
					if ( ! this.attr.session )
						return callback(PBXError.DTMF_NO_SESSION); 
					if ( tone.length > 1 )
						return callback(PBXError.DTMF_MANY_DIGITS);
					var _options = {
						eventHandlers: {
							failed:	function () {
									callback(PBXError.DTMF_SEND_FAIL);
								}
						}
					};
					this.attr.session.sendDTMF(tone, _options);
				}
		});

	var xmpp = Api.extend( /** @lends IPCortex.PBX.xmpp.prototype */ {
			_show:	{
				online:	{score: 4, desc: 'Online'},
				away:	{score: 3, desc: 'Away'},
				xa:	{score: 2, desc: 'Not Available'},
				dnd:	{score: 1, desc: 'Do not Disturb'}
			},
			/**
			 * Create a new XMPP entity when notified via tmpld.pl.
			 * XMPP entities can be local to the PABX, or remote contacts also.
			 * @constructs IPCortex.PBX.xmpp
			 * @augments Api
			 * @param {String} device The 'Custom/' node that refers to the entity.
			 * @protected
			 */
			construct: function(device, loggedin) {
				this.attr = {
						blf:		0,
						show:		'',
						desc:		'',
						xmpp:		{},
						eXxmpp:		{},
						optout:		[],
						online:		false,
						phone:		false,
						device:		device
				};
				this.hooks = [];
			},
			/**
			 * XMPP Getter
			 * @param {String|Number} attr Key for data to get.
			 *
			 * 'show': returns String - Selected online status ( '' | 'online' | 'dnd' | 'away')
			 *  
			 * 'xmpp': returns Object containing 'show' and 'status' values for XMPP state that has been set via the API.
			 * 
			 * 'states': returns Object keyed on XMPP resource containing 'show', 'status' and 'desc' for each. It will
			 * include the values from 'xmpp' above after a short processing delay.
			 *
			 * 'device': an internal device reference for this XMPP object.
			 *
			 * 'blf': Always 0 - Placeholder in case BLF is expected.
			 *
			 * 'phone': Always false - Placeholder in case handset state is expected.
			 *
			 * 'roster': null if invalid, else an object with the following attributes set if true:
			 * _RECEIVING_ (Can receive presence), _SENDING_ (Am sending presence), _CHAT_ (Sending and Receiving. Can chat),
			 * _SEND_REQ_ (Remote has requested us to send), _RECV_REQ_ (Local has request to receive), _conn_ (connection ID)
			 *
			 * @returns {*} Attribute value
			 */
			get:	function(attr) {
				var _id = this.attr.device.substr(7);
				if ( attr == 'xmppid' ) {
					/* We now return cid, not uname */
					// if ( getUser(_id) )
					// 	_id = getUser(_id).uname;
					return _id;
				}
				if ( attr == 'email' && ! getUser(_id) ) {
					return _id;
				}
				if ( attr == 'states' )
					return this.attr.eXxmpp;
				if ( attr == 'roster' )
					return xmpp._makeroster(_id);
				return this.attr[attr];
			},
			/**
			 * Turn the numeric roster value into something better.
			 * @private
			 */
			_makeroster:	function(id) {
				var flags = 0;
				var conn = null;
				if ( ! isNaN( id ) && ( id == live.userData.id || ! getUser(id) ) )
					flags = 15;
				for ( var i in live.xmppRoster ) {
					if ( live.xmppRoster[i].d == id ) {
						flags = live.xmppRoster[i].f;
						conn = i;
						break;
					}
				}
				var _r = [
					/* 0 */ {NONE: true},
					/* 1 */ {RECEIVING: true},
					/* 2 */ {SENDING: true},
					/* 3 */ {RECEIVING: true, SENDING: true, CHAT: true},
					/* 4 */ {SEND_REQ: true},
					/* 5 */ {RECEIVING: true, SEND_REQ: true},
					/* 6 */ null,
					/* 7 */ null,
					/* 8 */ {RECV_REQ: true},
					/* 9 */ null,
					/* 10 */ {SENDING: true, RECV_REQ: true},
					/* 11 */ null,
					/* 12 */ {SEND_REQ: true, RECV_REQ: true},
					/* 13 */ null,
					/* 14 */ null,
					/* 15 */ null
					][flags];
				if ( _r )
					_r.flags = flags;
				if ( _r && conn )
					_r.connId = conn;
				return _r;
			},
			/**
			 * Request permission to receive far end's state.
			 */
			xmppReq:	function(_r) {
				var _this = this;
				_r = _r || this.get('roster');
				if ( ! _r )
					return PBXError.XMPP_NOT_XMPP;
				if ( _r.RECEIVING )
					return PBXError.XMPP_ALREADY_RECV;

				function done() {
					var _count = 4;
					function check() {
						if ( flags.parsing.roster ) {
							setTimeout(check, 250);
							return;
						}
						_count--;
						_r = _this.get('roster');
						if ( _r && (_r.RECV_REQ || _r.RECEIVING) )
							return _addressReady();	/* Push roster changes withour reloading addresses or users. */
						if ( ! _r || _count < 1 )
							return;
						getRoster();
						setTimeout(check, 750);
					}
					check();
				}
				if ( ! _r.connId && ! isNaN( this.attr.device.substr(7) ) )
					Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=connect&cid=' + this.attr.device.substr(7), done);
				else if ( ! _r.connId )
					Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=connectext&jid=' + this.attr.device.substr(7), done);
				else
					Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=request&id=' + _r.connId, done);
				return PBXError.OK;
			},
			/**
			 * Auth far end to see my state.
			 */
			xmppAuth:	function(_r) {
				var _this = this;
				_r = _r || this.get('roster');
				if ( ! _r )
					return PBXError.XMPP_NOT_XMPP;
				if ( _r.SENDING )
					return PBXError.XMPP_ALREADY_AUTHED;
				if ( ! _r.connId )
					return PBXError.XMPP_NO_CONN;

				function done() {
					/* Auth implies request if needed */
					if ( ! _r.RECEIVING && ! _r.RECV_REQ )
						return _this.xmppReq(_r);
					var _count = 4;
					function check() {
						if ( flags.parsing.roster ) {
							setTimeout(check, 250)
							return;
						}
						_count--;
						_r = _this.get('roster');
						if ( _r && _r.SENDING )
							return _addressReady();	/* Push roster changes withour reloading addresses or users. */
						if ( ! _r || _count < 1 )
							return;
						getRoster();
						setTimeout(check, 750);
					}
					check();
				}
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=accept&id=' + _r.connId, done);
				return PBXError.OK;
			},
			/**
			 * De-Auth far end to see my state and delete association.
			 */
			xmppDel:	function(_r) {
				var _this = this;
				_r = _r || this.get('roster');
				if ( ! _r )
					return PBXError.XMPP_NOT_XMPP;
				if ( ! _r.connId )
					return PBXError.XMPP_NO_CONN;

				function done() {
					var _count = 4;
					function check() {
						if ( flags.parsing.roster ) {
							setTimeout(check, 250)
							return;
						}
						_count--;
						var _r = _this.get('roster');
						if ( ! _r || _r.NONE )
							return _addressReady();	/* Push roster changes withour reloading addresses or users. */
						if ( _count < 1 )
							return _addressReady(); /* Perhaps undo assumption about successful deletion */
						getRoster();
						setTimeout(check, 1500);
					}
					check();
				}
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=disconnect&id=' + _r.connId, done);

				/* Pre-emptive assumption of success */
				delete live.xmppRoster[_r.connId];
				_addressReady();

				return PBXError.OK;
			},
			/**
			 * Run all hooks on this XMPP entity.
			 * @private
			 */
			run:	function() {
				var _hooks = this.hooks;
				var _device = this.attr.device;
				if ( typeof(cH.presenceCB) == 'function' ) {
					/* XMPP presence information for logged in person. */
					if ( live.userData.id && _device == 'Custom/' + live.userData.id )
						cH.presenceCB(this);
				}
				for ( var i = 0; i < _hooks.length; i++ )
					_hooks[i].run(_hooks[i].filter, _hooks[i].hid, this);
			},
			/**
			 * Add a new hook to this xmpp entity
			 * @param {Callback~xmppCB} hook The callback function for running this hook
			 * @param {Object} filter Describes the filter used to generate this hook {cid: contactID, xmpp: xmppDevice}
			 * @param {Number} hid Hook ID number, passed to hook as 2nd parameter
			 * @private
			 */
			/**
			 * Remove a hook from this room
			 * @param {Number} hid Hook ID number to remove
			 * @private
			 */
			/**
			 * Update this XMPP entity's headline presence information using the highest priority XMPP status.
			 * Also stores all received presence frames in a cache for later replay.
			 * @param {Object} presence The eXxmpp presence data from tmpld.pl
			 * @private
			 */
			status: function(eXxmpp, outboundXmpp, optout) {
				eXxmpp = eXxmpp || {};
				var _priority = 0;
				this.attr.show = '';
				this.attr.desc = '';
				this.attr.eXxmpp = {};
				this.attr.online = false;
				if ( outboundXmpp ) {
					this.attr.xmpp = {show: outboundXmpp.show, status: outboundXmpp.status == 'undefined' ? null : Utils.doDecodeState(outboundXmpp.status)};
					if ( this.attr.device == 'Custom/' + live.userData.id && ! eXxmpp['ocm' + live.userData.id] )
						eXxmpp['ocm' + live.userData.id] = {s: outboundXmpp.show, t: outboundXmpp.status};
				}
				for ( _resource in eXxmpp ) {
					this.attr.online = true;
					var _show = eXxmpp[_resource].s == '' ? 'online' : eXxmpp[_resource].s;
					var _status = Utils.doDecodeState(eXxmpp[_resource].t) == 'undefined' ? '' : Utils.doDecodeState(eXxmpp[_resource].t);
					if ( ! xmpp._show[_show] )
						continue;
					if ( xmpp._show[_show].score > _priority ) {
						this.attr.show = _show;
						_priority = xmpp._show[_show].score;
						this.attr.desc = xmpp._show[_show].desc;
					}
					this.attr.eXxmpp[_resource] = {show: _show, desc: xmpp._show[_show].desc, status: _status};
				}
				if ( optout )
					this.attr.optout = optout.split(',');
				else
					this.attr.optout = [];
				/* No run() needed here. The caller deals with that */
			},
			/**
			 * Update the state/status of the local user's XMPP entity. Called via {@link IPCortex.PBX.setStatus}
			 * @param {String} show (online|away|xa|dnd)
			 * @param {String} status Free text status description
			 * @private
			 */
			setStatus: function(show, status) {
				show = show || this.attr.xmpp.show || '';
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=status&show=' + show + '&status=' + (status || ''));
			},
			/**
			 * Create a new chat room with this contact
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 */
			chat:	function(callback) {
				if ( ! this.attr.online )
					return PBXError.CHAT_USER_OFFLINE;
				for ( var _key in live.xmppRoster ) {
					if ( live.xmppRoster[_key].d == this.attr.device.substr(7) )
						return room.requestNew(0 - _key, callback);
				}
				return PBXError.CHAT_NO_ROSTER;
			}
		});

	var device = Api.extend( /** @lends IPCortex.PBX.device.prototype */ {
			_callState:
			{
				'null':  {'null': 'down', down: 'down', dialing: 'dial', ring: 'ring', ringing: 'ring', up: 'ring', park: 'ring', hold: 'ring'},
				down:    {'null': 'down', down: 'down', dialing: 'dial', ring: 'ring', ringing: 'ring', up: 'ring', park: 'ring', hold: 'ring'},
				dialing: {'null': 'dial', down: 'dial', dialing: 'dial', ring: 'ring', ringing: 'ring', up: 'call', park: 'call', hold: 'call'},
				ring:    {'null': 'ring', down: 'ring', dialing: 'ring', ring: 'ring', ringing: 'ring', up: 'ring', park: 'ring', hold: 'ring'},
				ringing: {'null': 'ring', down: 'ring', dialing: 'ring', ring: 'ring', ringing: 'ring', up: 'ring', park: 'ring', hold: 'ring'},
				up:      {'null': 'ring', down: 'ring', dialing: 'call', ring: 'ring', ringing: 'ring', up: 'up',   park: 'up',   hold: 'up'},
				park:    {'null': 'park', down: 'park', dialing: 'park', ring: 'park', ringing: 'park', up: 'park', park: 'park', hold: 'park'},
				hold:    {'null': 'hold', down: 'hold', dialing: 'hold', ring: 'hold', ringing: 'hold', up: 'hold', park: 'hold', hold: 'hold'}
			},
			/**
			 * Create a new device when notified via tmpld.pl.
			 * @constructs IPCortex.PBX.device
			 * @augments Api
			 * @param {String} device Device name, eg. SIP/phone
			 * @protected
			 */
			construct: function(device) {
                console.log('api:construct(' + device + ')');
				this.attr = {
						blf:		0,
						opt:		{in: [], out: []},
						park:		{name: '', number: ''},
						calls:		{},
						status:		{},
						options:	{},
						sessions:	{},
						optout:		[],
						jssip:		null,
						rtcpwd:		null,
						mailbox:	null,
						opttimerA:	null,
						opttimerB:	null,
						agent:		'',
						contact:	'',
						mac:		devToMac[device],
						device:		device,
						history:	false,
						features:	'',	/* A backstop of 'no features' */
						webrtc:		(device.search(/^SIP\/webrtc\d+$/) != -1),
						ipaddr:		null,
						ipport:		null
				};
				this.hooks = [];
				if ( this.attr.webrtc && haveJsSIP() ) {
					var _id = device.substr(10);
					this.attr.rtcpwd = webrtcPass['webrtc' + _id];
				}
			},
			/**
			 * Last chance cleanup before destroy runs.
			 * @private
			 */
			pre_destroy: function() {
				hI.devices[this.attr.device] = null;
				delete hI.devices[this.attr.device];
				if ( this.attr.jssip ) {
					if ( this.attr.jssip.isRegistered() )
						this.attr.jssip.unregister();
					if ( this.attr.jssip.stop )
						this.attr.jssip.stop();
					this.attr.jssip = null;
				}
			},
			/**
			 * Fetch information about this device.
			 * attr of (line, extension, hotdesk, owner, name) fetches the 'primary' extension information for the device.
			 * attr of 'list' fetches the a list of extensions that call this device.
			 * If attr exists on {@link IPCortex.PBX~Phone} then return it otherwise return one of (blf, calls, status, device, mac)
			 * @param {String} attr Key for data to get.
			 * __list__: List of extension objects that call this device {name:, extension:, num:...}. __num__ is display number,
			 *           __extension__ may have _company appended for private extensions.
			 * __mailbox__: Mailbox ID for this device
			 * __line__: Line number for this device
			 * __name__: Primary extension name for this device
			 * __extension__: Primary extension for this device
			 * __scope__: Scope of primary extension if private
			 * __hotdesk__: ???
			 * __owner__: ???
			 * @todo TODO: More attrs here!
			 * @returns {*} Attribute value
			 */
			get: function(attr) {
				var _translate = {
						name:		'n',
						owner:		'o',
						hotdesk:	'h',
						extension:	'e',
						line:		'i',
						list:		'l'
				};
				var _translateList = {
						e:	'extension',
						l:	'link',
						n:	'name',
						o:	'owned',
						t:	'type',
				};
				var _amHotdeskUser = false;
				var _extension = _getExtensionByDevice(this.attr.device);

				if ( live.hotdesked_to[this.attr.device] ) {
					var _cid = null;
					var _hddst = live.hotdesked_to[this.attr.device];
					if ( devToMac[_hddst] == live.cidToUsr[live.userData.id].phone + '' + live.cidToUsr[live.userData.id].port ) {
						_cid = live.userData.id;
					} else if ( _hddst.substr(0,8) == 'Hotdesk/' ) {
						_cid = extByExt[_hddst.substr(8)].owner;
					}
					if ( _cid == live.userData.id && lookUp.xmpp['Custom/' + live.userData.id] )
						_amHotdeskUser = true;
				}
				if ( attr == 'list' ) {
					var _list = [];
					if ( ! _extension || ! _extension.l )
						return _list;
					for ( var i = 0; i < _extension.l.length; i++ ) {
						if ( live.adminID != live.userData.id ) {
							if ( _extension.l[i].l == 'hotdesk' && !_amHotdeskUser )
								continue;
							if ( _extension.l[i].l != 'hotdesk' && _amHotdeskUser )
								continue;
						}
						var _tmp = {};
						for ( _key in _translateList )
							_tmp[_translateList[_key]] = _extension.l[i][_key];
						_tmp.canopt = extByExt[_tmp.extension].canopt;
						_tmp.num = _tmp.extension.split('_')[0];
						_list.push(_tmp);
					}
					return _list;
				}
				if ( attr == 'mailbox' ) {
					if( this.attr.mailbox && lookUp.mbx[this.attr.mailbox] )
						return lookUp.mbx[this.attr.mailbox];
					return null;
				}
				if ( attr == 'extension' ) {
					return _extension.e ? _extension.e.split('_')[0] : null;
				}
				if ( attr == 'scope' ) {
					return _extension.e ? _extension.e.split('_')[1] : null;
				}
				if ( attr == 'optout' ) {
					if ( _amHotdeskUser )
						return lookUp.xmpp['Custom/' + live.userData.id].get('optout');
				}
				if ( _translate[attr] )
					return _extension[_translate[attr]];
				var _phone = getPhone(this.attr.mac);
				if ( _phone[attr] )
					return _phone[attr];
				return this.attr[attr];
			},
			/**
			 * Run all hooks on this device
			 * @private
			 */
			run:	function() {
				/* opt in/out queues a device.run() to be sure an update always occurs. */
				if ( this.attr.opttimerB )
					clearTimeout(this.attr.opttimerB);
				this.attr.opttimerB = null;

				var _hooks = this.hooks;
/* TODO: This can filter by called extension if the filter contains an extension number
 * assuming this is even possible ??? Perhaps filter device.get('calls') on just filtered
 * extension.
 */
				for ( var i = 0; i < _hooks.length; i++ )
					_hooks[i].run(_hooks[i].filter, _hooks[i].hid, this);
			},
			/**
			 * Add a new hook to this device
			 * @param {Callback~xmppCB} hook The callback function for running this hook
			 * @param {Object} filter Describes the filter used to generate this hook {cid: contactID, xmpp: xmppDevice}
			 * @param {Number} hid Hook ID number, passed to hook as 2nd parameter
			 * @private
			 */
			/**
			 * Remove a hook from this device
			 * @param {Number} hid Hook ID number to remove
			 * @private
			 */
			/**
			 * Update the status, blf state and opt in/out data of a device from tmpld.pl data.
			 * @param {String} name Device name
			 * @param {Object} info Data from tmpld.pl on the above device
			 * @private
			 */
			status:	function(name, info) {
				/* Special case for park orbits which have no status */
				/* Not sure about the use/abuse of the park object! */
				if ( name.substr(0,5) == 'Park/' ) {
					this.attr.blf = info.blf;
					this.attr.status = {status: 'up', comment: 'Ok'};
					if ( info.device && ! Utils.isEmpty(info.device.parkedNum) )
						this.attr.park = {
							number:	info.device.parkedNum,
							name:	info.device.parkedName || '',
							start:	new Date()
						};
					else
						this.attr.park = {
							number:	'',
							name:	'',
							start:	null
						};
					return;
				}
				var _device = info.device;
				if ( !_device || ! info.device.status )
					return;
				this.attr.mailbox = _device.mailbox; /* We allow invalid values to be stored and .get() sorts it out */
				var _status = info.device.status;
				var _devStatus = {status: 'down', comment: 'Unknown'};
				if ( _status.search(/^ok/i) != -1 ) 
					_devStatus = {status: 'up', comment: 'Ok'};
				else if ( _status.search(/^unmon/i) != -1 ) {
					_devStatus = {status: 'unknown', comment: 'Unmonitored'};
					if ( name.substr(0,4) == 'SIP/' && _device.regExpires && _device.regExpires > 0 )
						_devStatus = {status: 'up', comment: 'Ok'};
					else if ( name.substr(0,4) != 'SIP/' && _device.ipport && _device.ipport > 0 )
						_devStatus = {status: 'up', comment: 'Ok'};
					else if ( _device.ipport && _device.ipport == 0 )
						_devStatus = {status: 'down', comment: 'Unknown'};
				} else if ( _status.search(/^unreg/i) != -1 )
					_devStatus = {status: 'unknown', comment: 'Unregistered'};
				else if ( _status.search(/^unkno/i) != -1 )
					_devStatus = {status: 'down', comment: 'Unknown'};
				else if ( _status.search(/^unrea/i) != -1 )
					_devStatus = {status: 'down', comment: 'Unreachable'};
				else if ( name.substr(0,4) == 'SIP/' && _device.ipport == 0 )
					_devStatus = {status: 'down', comment: 'Registration expired'};
				else
					_devStatus = {status: 'down', comment: 'Unknown'};
				if ( ! Utils.isEmpty(_device.ipaddr) )
					this.attr.ipaddr = _device.ipaddr;
				if ( ! Utils.isEmpty(_device.ipport) )
					this.attr.ipport = _device.ipport;
				if ( ! Utils.isEmpty(_device.contact) )
					this.attr.contact = _device.contact;
				if ( ! Utils.isEmpty(_device.agent) )
					this.attr.agent = _device.agent;
				this.attr.status = _devStatus.status;
				this.attr.blf = info.blf;
				if ( info.customData && info.customData.optout )
					this.attr.optout = info.customData.optout.split(',');
				else
					this.attr.optout = [];

				/* Opt in/out may refer to a private extension, if so, say so. */
				for( var i=0; i < this.attr.optout.length; i++ ) {
					if ( extByExt[this.attr.optout[i] + '_' + info.company] )
						this.attr.optout[i] += '_' + info.company;
				}
			},
			/**
			 * Update the calls for this device from tmpld.pl data.
			 * @param {Array} calls An array of call data passed from tmpld.pl
			 * @private
			 */
			update:	function(calls) {
				var _active = {};	// Active calls ignore a Replaces: header.
				for ( var i = 0; i < calls.length; i++ ) {
/* TODO (Perhaps) - Build secondary this.attr.blf_no_hd data for direct dialled, non hotdesk calls.
 * Only necessary on line 1. only necessary if hotdesked_on is set for this device
 * also assumes we even get calls for these devices! Un-hotdesk should reset to blf_no_hd null.
 * 
 * Not sure how useful this is because directed pickup is not accurate enough :(
 *
 * Should this actually be BLF per dialled extension? this.attr.blf[nnn]
 */
					if ( calls[i].party && calls[i].party.toLowerCase() != 'dead' )
						_active[calls[i].ID] = true;	// Active, so will not be Replace'd
				}
				for ( var i = 0; i < calls.length; i++ ) {
					var _call = null;
					if ( this.attr.calls[calls[i].replaces] && ! _active[calls[i].replaces] ) {
						_call = this.attr.calls[calls[i].replaces];
						_call.set(null, {id: calls[i].ID, cid: calls[i].callID});
						this.attr.calls[calls[i].ID] = _call;
						this.attr.calls[calls[i].replaces] = null;
						delete this.attr.calls[calls[i].replaces];
					} else if ( this.attr.calls[calls[i].ID] )
						_call = this.attr.calls[calls[i].ID];
					else if ( calls[i].party.toLowerCase() != 'dead' ) {
						_call = call.create(calls[i].ID, calls[i].callID, this, calls[i].dial || calls[i].callerID);
						this.attr.calls[calls[i].ID] = _call;
						/* Think this is right to capture dialled number for inbound */
						if ( calls[i].dial && calls[i].bridgedTo && calls[i].bridgedTo != '' ) {
							_call.set('extension', calls[i].dial);
							_call.set('extname', calls[i].dialName || '');
						}
					}
					if ( ! _call )
						continue;
					if ( calls[i].party.toLowerCase() == 'dead' ) {
						_call.set(null, {state: 'dead', nrstate: 'dead', brstate: 'dead', session: null, end: (new Date()).getTime()});
					} else {
						var _bridgeState = 'null';
						var _state = calls[i].state || 'null';
						if ( ! Utils.isEmpty(calls[i].party) )
							_call.set('party', calls[i].party.toLowerCase());
						if ( calls[i].bridgedObj ) {
							_bridgeState = calls[i].bridgedObj.state || 'null';
							var _callerID = calls[i].bridgedObj.callerID || '';
							var _callerName = calls[i].bridgedObj.callerName || '';
							if ( _callerName != '' && _callerName != _callerID )
								_call.set(null, {name: _callerName, number: _callerID, brcid: true});
							else if ( _callerID != '' )
								_call.set(null, {name: '', number: _callerID, brcid: true});
							else if ( ! _call.get('brcid') )
								_call.set(null, {name: '(CID Unknown)', number: ''});

							/* Fully bridged call, so default to 'callee' */
							if ( Utils.isEmpty(_call.get('party')) )
								_call.set('party', 'callee');

							/* If came via a queue, copy inq, outq data from bridge and
							 * change 'extension' of call if possible because it is only
							 * possible on a queue when it bridges. Also fix caller/callee
							 * for queue, which is reversed because of Queues */
							if ( ! _call.get('inq') && ! _call.get('outq') && calls[i].bridgedObj.q_time ) {
								_call.set('inq', calls[i].bridgedObj.q_time * 1000);
								_call.set('outq', (new Date()).getTime());
								_call.set('party', 'callee');
							} else if ( calls[i].q_time ) {
								_call.set('party', 'caller');
							} else if ( ! Utils.isEmpty(calls[i].party) && calls[i].party.toLowerCase() == 'callee' &&
								    ! Utils.isEmpty(calls[i].bridgedObj.party) && calls[i].bridgedObj.party.toLowerCase() == 'callee' && calls[i].bridgedObj.dial ) {
								/* Try to flip party on OCM dialled calls. */
								_call.set('party', 'caller');
							}

							/* If we can get a dialled name/number, save them */
							if ( calls[i].bridgedObj.dial && ! _call.get('extension') ) {
								_call.set('extension', calls[i].bridgedObj.dial);
								_call.set('extname', calls[i].bridgedObj.dialName || '');
							}

							/* If we are callee, and have no srcId, try and set it */
							if ( _call.get('party') == 'callee' && ! _call.get('srcId') && calls[i].bridgedTo.search(/^\d+\.\d+/) != -1 )
								_call.set('srcId', calls[i].bridgedTo);
						} else if ( calls[i].bridgedTo ) {
							_bridgeState = 'up';
							var _bridgeInfo = calls[i].bridgedTo.split(':');
							if ( _bridgeInfo[0] == 'PLAYBACK' ) {
								if ( _call.get('brcid') )
									_call.set('name', 'Playback');
								else
									_call.set(null, {name: 'Playback', number: ''});
							} else if ( _bridgeInfo[0] == 'VOICEMAIL' ) {
								var _vmNum = _bridgeInfo[1].replace(/^[ub]/,'').split(/@/)[0];
								_call.set(null, {name: 'Voicemail', number: _vmNum});
							} else if ( _bridgeInfo[0] == 'MEETME' ) {
								_call.set('name', 'Conference');
								if ( ! _call.get('extension') && calls[i].colp ) {
									_call.set('extension', calls[i].colp);
									_call.set('extname', calls[i].colpName || '');
								}
							} else if ( _bridgeInfo[0] == 'QUEUE' ) {
								if ( calls[i].q_time )
									_call.set('party', 'caller');
								_call.set(null, {name: 'Queue', number: _bridgeInfo[1].substr(2)});
								if ( calls[i].colp )
									_call.set('number', calls[i].colp);
								if ( calls[i].colpName )
									_call.set('name', calls[i].colpName);

								if ( lookUp.qcall[_call.get('id')] != _bridgeInfo[1] ) {
									if ( lookUp.que['Queue/' + lookUp.qcall[_call.get('id')]] )
										lookUp.que['Queue/' + lookUp.qcall[_call.get('id')]].queuecall(_call, calls[i].bridgedTo);
									lookUp.qcall[_call.get('id')] = _bridgeInfo[1];
								}

								if ( ! _call.get('extension') && calls[i].colp ) {
									_call.set('extension', calls[i].colp);
									_call.set('extname', calls[i].colpName || '');
								}
							} else if ( _bridgeInfo[0] == 'CALL' ) {
								_bridgeState = _bridgeInfo[1];
								var _callerID = calls[i].colp || '';
								var _callerName = calls[i].colpName || '';
								if ( _callerName != '' && _callerName != _callerID )
									_call.set(null, {name: _callerName, number: _callerID, brcid: true});
								else if ( _callerID != '' )
									_call.set(null, {name: '', number: _callerID, brcid: true});
								else if ( ! _call.get('brcid') )
									_call.set(null, {name: '(CID Unknown)', number: ''});

								if ( ! _call.get('extension') && calls[i].colp ) {
									_call.set('extension', calls[i].colp);
									_call.set('extname', calls[i].colpName || '');
								}
							}

							/* Bridged to a 'special' node, so default to 'caller' */
							if ( Utils.isEmpty(_call.get('party')) )
								_call.set('party', 'caller');
						} else if ( calls[i].colp )
							_call.set(null, {name: calls[i].colpName, number: calls[i].colp});

						_call.set('nrstate', _state);
						var _stateTok = device._callState[_state][_bridgeState];
						if ( calls[i].holdState == 1 )
							_stateTok = device._callState.hold[_bridgeState];
						if ( ! _call.get('start') && _stateTok.search(/^(up|hold)$/) != -1 )
							_call.set('start', (new Date()).getTime());
						_call.set(null, {brstate: _bridgeState, state: _stateTok, dial: calls[i].dial});
					}
					if ( lookUp.qcall[_call.get('id')] && lookUp.que['Queue/' + lookUp.qcall[_call.get('id')]] )
						lookUp.que['Queue/' + lookUp.qcall[_call.get('id')]].queuecall(_call, calls[i].bridgedTo);
					if ( this.attr.sessions[_call.get('cid')] ) {
						if ( ! _call.get('session') )
							_call.set('session', this.attr.sessions[_call.get('cid')]);
						this.attr.sessions[_call.get('cid')] = null;
						delete this.attr.sessions[_call.get('cid')];
					}
				}
			},
			/**
			 * Enable or disable history callback for this device/line. Defaults to off.
			 * Global callback must be set before this becomes active, but callbacks will
			 * catch-up retrospectively.
			 * @param {Bool} enable true/false to enable/disable respectively
			 */
			history: function(enable) {
				if ( typeof(enable) != 'boolean' )
					return;
				/* Playback any loaded data for this line */
				if ( enable && ! this.attr.history && hI.cache[this.attr.device] ) {
					for ( var i = 0; i < hI.cache[this.attr.device].length; i++ ) {
						if ( ! history.is_dupe(hI.cache[this.attr.device][i]) ) {
							try {
								history.create(hI.cache[this.attr.device][i]);
							} catch(e) {};
						}
					}
					hI.cache[this.attr.device] = null;
					delete hI.cache[this.attr.device];
				}
				if ( enable ) {
					hI.devices[this.attr.device] = this;
				} else {
					hI.devices[this.attr.device] = null;
					delete hI.devices[this.attr.device];
				}
				this.attr.history = enable;
			},
			/**
			 * Remove and detach a call from this device.
			 * @param {IPCortex.PBX.call} call The call instance to remove from the list.
			 * @private
			 */
			remove: function(call) {
				if ( ! call )
					return;
				if ( this.attr.history ) {
					try {
						history.create(call);
					} catch(e) {};
				}
				var _id = call.get('id');
				/* Backstop to avoid leaking queue call refs */
				if ( lookUp.qcall[_id] && lookUp.que['Queue/' + lookUp.qcall[_id]] )
					lookUp.que['Queue/' + lookUp.qcall[_id]].queuecall(call, 'dead');
				this.attr.calls[_id] = null;
				delete this.attr.calls[_id];
				/* Ensure any RTCsession objects for this call are cleaned up */
				this.attr.sessions[call.get('cid')] = null;
				call.set('session', null);
				call.destroy();
			},
			/**
			 * Attempt to hold all WebRTC lines except the one with the specified session
			 * @param {Object} session The session object from jsSIP
			 * @private
			 */
			_holdexcept:
				function(session) {
                    console.log('api::_holdexcept')
					if ( ! haveJsSIP() || ! this.attr.jssip ) 
						return;
					for ( var id in this.attr.calls ) {
						var call = this.attr.calls[id];
						if ( call.get('state') == 'up' && call.get('session') != null && call.get('session') != session )
							call.get('session').hold();
					}
				},
			/**
			 * Save WebRTC session against the IPC-ID found in the 100 Trying headers
			 * @param {Object} session The session object from jsSIP
			 * @param {Object} headers SIP Headers from jsSIP
			 * @private
			 * @todo Store my X-Ipc-Id for cleanup if I'm destroyed before it's matched
			 */
			trying:
				function(session, headers) {
					var _xIpcId = headers['X-Ipc-Id'];
					var _sessions = this.attr.sessions;
					if ( _xIpcId && _xIpcId.length == 1 && ! _sessions[_xIpcId[0].raw] )
						_sessions[_xIpcId[0].raw.replace(/^-/,'')] = session;
				},
			/**
			 * Attempt to link stored session to call object if session has a remote stream
			 * and run hooks to update front-end.
			 * @param {Object} session The session object from jsSIP
			 * @private
			 */
			progress:
				function(session) {
					if (!session || !session.hasOwnProperty('getRemoteStreams') || session.getRemoteStreams().length == 0 )
						return;
					for ( var _uid in this.attr.calls ) {
						var _call = this.attr.calls[_uid];
						if ( this.attr.sessions[_call.get('cid')] ) {
							if ( ! _call.get('session') )
								_call.set('session', this.attr.sessions[_call.get('cid')]);
							this.attr.sessions[_call.get('cid')] = null;
							delete this.attr.sessions[_call.get('cid')];
						}
					}
					this.run();
				},
			/**
			 * Dial a number from this device. (Old incarnation)
			 * @param {String} number The number to dial
			 * @param {Bool} autohold Request the autohold feature if the handset supports it
			 * @param {Bool} autoanswer Request the autoanswer feature if the handset supports it
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 * NEW Incarnation allows autohold and autoanswer to be omitted.
			 * @memberOf IPCortex.PBX.device
			 * @instance
			 */
			dial:	function(number, autohold, autoanswer, callback) {
					console.log('19:16 | api::dial || attr: ',this.attr.jssip);

                    var _this = this;
					function result(txt) {
						_this._result(callback, txt || '')
					}
					function trying(e) {
						_this.trying(e.session, e.response.headers);

						/* This should always happen, so use
						 * it as a signal to put all other calls
						 * on hold
						 */
						_this._holdexcept(e.session);
					}
					function progress(e) {
						_this.progress(e.session);
					}
					var _options = this.attr.options;
					if ( typeof autohold == 'function' ) {
						callback = autohold
						autohold = autoanswer = null;
					}
					if ( autohold == null )
						autohold = _options.autohold
					if ( autoanswer == null )
						autoanswer = _options.autoanswer
					if ( number == null || number == '' ) {
						setTimeout(result, 10);
					} else if ( haveJsSIP() && this.attr.jssip ) {
                        console.log('api::dial to call jssip | sip:' + number);
                        console.log('api::dial to call jssip | host:' + live.origHost);
                        console.log('api::dial | callback: ', callback);
						var _sessionOptions = {
							eventHandlers: {
								trying:		trying,
								progress:	progress,
								accepted:	function(e) { },
								confirmed:	progress,
								ended:		function(e) { },
								failed:		function(e) {
											if ( e && e.originator == 'local' && e.cause == 'Canceled' )
												return;
											/* Error callback - Fake up a failed message */
											_this._result(callback, 'RTC call failed');
										}
							},
							mediaConstraints: {
								audio:		true,
								video:		false,
							}
						}
						if ( typeof(_options.microphone) == 'string' && _options.microphone != 'default' )
							_sessionOptions.mediaConstraints.audio = {optional: [{sourceId: _options.microphone}]};
                        console.log('api::dial() | jssip  ',this.attr.jssip);



						var _session = this.attr.jssip.call('sip:' + number + '@' + live.origHost, _sessionOptions);

                        console.log('api::dial() | session  ',_session);



                        this.attr.session = _session;

                        var _config = {
                            ws_servers:		'wss://' + live.origHost + ':' + ports.wss + '/ws',
                            uri:			'sip:' + this.attr.device.substr(4) + '@' + live.origHost,
                            turn_servers:		live.turnServers,
                            stun_servers:		live.stunServer,
                            password:		this.attr.rtcpwd
                        };


                        console.log('api::dial() | config: ',this.attr.config);

                        //can we make a separate JsSIPCordovaRTCEngine object?


                        // the config is not exactly the same
                        var config = {
                            isInitiator: true,
                            turn: {
                                host: 'turn:ec2-54-68-238-149.us-west-2.compute.amazonaws.com:3478',
                                username: 'test',
                                password: 'test'
                            },
                            turn_servers: {
                                host: '',
                                username: 'test',
                                password: 'test'
                            },
                            streams: {
                                audio: true,
                                video: true
                            }
                        };


                        var _phonertcSession = new JsSIPCordovaRTCEngine(_session, config);

                        console.log('api::dial() | _phonertcSession  ',_phonertcSession);


                        this.attr.config = config;

                        this.attr.phonertcSession = _phonertcSession;


					} else {
                        console.log('api::dial to call http');
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
								'cmd=call' +
								'&number=' + number + 
								'&autohold=' + (autohold === true ? '1' : '0') +
								'&autoanswer=' + (autoanswer === true ? '1' : '0') +
								'&line=' + (this.get('line') || '') +
								'&mac=' + this.attr.mac, result);
					}
				},
			/**
			 * Opt in or out of an extension on this device.
			 * @param {String} extension The extension number to opt in/out of.
			 * @param {Bool} optin true: opt-in, false: opt-out
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 * This callback does not determine the success of the request, just that is was a valid request based on initial
			 * checks.
			 * @return {Bool} false if opt in/out is not allowed for this extension.
			 */
			opt:	function(extension, optin, callback) {
					var _this = this;
					function run() {
						_this.run();
					}
					function result(txt) {
						_this._result(callback, txt)
					}
					function post() {
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm',
								'cmd=opt' +
								'&in=' + _this.attr.opt.in.join(',') + 
								'&out=' + _this.attr.opt.out.join(',') +
								'&mac=' + _this.attr.mac, result);
						if ( ! _this.attr.opttimerB )
							_this.attr.opttimerB = setTimeout(run, 31000);
						_this.attr.opt = {in: [], out: []};
						_this.attr.opttimerA = null;
					}
					if ( ! extByExt[extension].canopt )
						return false;
					if ( optin )
						this.attr.opt.in.push(extension);
					else
						this.attr.opt.out.push(extension);
					if ( ! this.attr.opttimerA )
						this.attr.opttimerA = setTimeout(post, 500);
					return true;
				},
			/**
			 * Compare 2 devices, returns -1, 0, 1. usable as a sort function.
			 * @param {IPCortex.PBX.device} device The device to compare with
			 * @return {Bool} true: devices are the same.
			 */
			compare:
				function(device) {
					if ( ! device )
						return false;
					if ( this.get('device').substr(0, 10) == 'SIP/webrtc' && device.get('device').substr(0, 10) != 'SIP/webrtc' )
						return -1;
					if ( this.get('device').substr(0, 10) != 'SIP/webrtc' && device.get('device').substr(0, 10) == 'SIP/webrtc' )
						return 1;
					if ( this.get('line') == device.get('line') ) {
						if ( this.get('device') == device.get('device') )
							return 0;
						if ( this.get('device') < device.get('device') )
							return -1;
						return 1;
					}
					if ( this.get('line') == 'H' )
						return -1;
					if ( device.get('line') == 'H' )
						return 1;

					if ( this.get('device') == device.get('device') )
						return this.get('line') < device.get('line') ? -1 : (this.get('line') > device.get('line') ? 1 : 0);
					if ( this.get('device') < device.get('device') )
						return -1;
					return 1;
				},
			enablertc:
				function() {

                    console.log('api::enablertc');
					if ( this.attr.jssip )
						return;
					if ( ! haveJsSIP() )
						return false;
					if ( ! this.attr.rtcpwd )
						return false;
					if ( ! live.origURI.substr(0,8) == 'https://' )
						return false;
					var _this = this;
					function trying(e) {
						if ( e.originator != 'remote' )
							return;
						_this.trying(e.session, e.request.headers);
					}
					var _config = {
						ws_servers:		'wss://' + live.origHost + ':' + ports.wss + '/ws',
						uri:			'sip:' + this.attr.device.substr(4) + '@' + live.origHost,
						turn_servers:		live.turnServers,
						stun_servers:		live.stunServer,
						password:		this.attr.rtcpwd
					};


                    console.log('A api::enablertc: config: ',_config)
                    this.attr.config = _config;

                    console.log('B api::enablertc: config: ',this.attr.config);

                    console.log('13:28 - fixing jssip for JsSIPCordovaRTCEngine!');
                    if (window.cordova) {
                        console.log('I`m cordova! ');
                       JsSIP.rtcEngine = JsSIPCordovaRTCEngine;
                       console.log('Engine: ',typeof(JsSIP.rtcEngine));
                    }
					var _jsSip = new JsSIP.UA(_config);
					_jsSip.on('newRTCSession', trying); 
					this.attr.jssip = _jsSip;
					_jsSip.start();
					window.addEventListener('beforeunload', function() { _jsSip.stop(); });
				}
		});

	var history = Api.extend( /** @lends IPCortex.PBX.history.prototype */ {
			/**
			 * Construct a history object from either an old call or from an imported object.
			 * @constructs IPCortex.PBX.history
			 * @augments Api
			 * @param {Object|IPCortex.PBX.call} item The data for the history entry
			 * @protected
			 */
			construct: function(item) {
				var _this = this;
				this.attr = {
						id:		null,
						party:		null,
						start:		null,
						end:		null,
						inq:		null,
						outq:		null,
						note:		null,
						info:		null,
						number:		null,
						extension:	null,
						extname:	null,
						stamp:		null,
						name:		null,
						device:		null,
						devname:	null
				};
				var _initial = false;
				if ( item instanceof call ) {
					for ( var x in this.attr )
						this.attr[x] = item.get(x);
					this.attr.devname = this.attr.device.get('name');
					this.attr.device = this.attr.device.get('device');
					if ( !Utils.isEmpty(this.attr.party) && Utils.isEmpty(this.attr.start) ) {
						if ( this.attr.party == 'callee' )
							this.attr.party = 'missed';
						else
							this.attr.party = 'noanswer';
					}
				/* Duplicate call info on another line? Call answered elsewhere? Call proceeding elsewhere? Do not create entry. */
				/* If a non-dead call exists still elsewhere, assume it will come here in the end. */
					if ( item.get('party') == 'callee' && item.get('srcId') ) {
						var _src = item.get('srcId');
						for ( var d in hI.devices ) {	/* All history enabled devices */
							var _calls = hI.devices[d].get('calls');
							for ( var i in _calls ) {
								if ( _calls[i] !== item && _calls[i].get('srcId') == _src ) {
									this.destroy();
									throw new Error('Cannot construct history. Call continues elsewhere!');
								}
							}
						}
					}
				} else if ( item instanceof Object ) {
					for ( var x in this.attr )
						this.attr[x] = Utils.isEmpty(item[x]) ? null : item[x];
					_initial = true;
				}
				if ( Utils.isEmpty(this.attr.party) ) {
					/* Is this a bit harsh??? Seems okay so far. */
					this.destroy();
					throw new Error('Cannot construct history. Not enough data!');
				}
/* TODO */
// console.log('New history: ', this.attr);
				hI.history.push(this);
				hI.updated = (new Date()).getTime();
				if ( hI.cb )
					hI.cb(this, _initial);
			},
			/**
			 * Getter for history
			 * @param {String} attr Key for data to get. Same data as can be fetched for a call.
			 * 
			 * Additionally __remote__ and __remotename__ fetch the name and number of the non-local
			 * call party regardless of call direction.
			 * @returns {*} Attribute value
			 */
			get:	function(attr) {
				if ( attr == 'remote' || attr == 'remotename' ) {
					var num_key = 'number';
					var name_key = 'name';
					if ( this.attr.party == 'caller' || this.attr.party == 'noanswer' ) {
						if ( this.attr.extension )
							num_key = 'extension';
						if ( this.attr.extname )
							name_key = 'extname';
					}
					if( attr == 'remote' )
						return this.attr[num_key];
					return this.attr[name_key];
				}
				return this.attr[attr];
			},
			/**
			 * Dupe-check a history source item. Return false if not a dupe. Returns true if a dupe.
			 * @param {Object} hist Object to dupe check
			 * @private
			 * @static
			 */
			is_dupe:	function(hist) {
				if ( ! hI || ! hI.history || typeof hI.history != 'object' )
					return false;
				var _device;
				if ( hist instanceof call && hist.get('device') )
					_device = hist.get('device').get('device');
				else
					_device = hist.device;
				for ( var i = 0; i < hI.history.length; i++ ) {
					_h = hI.history[i];
					if ( (hist.stamp || null) == _h.attr.stamp && (_device || null) == _h.attr.device &&
					     (hist.name || null) == _h.attr.name && (hist.extension || null) == _h.attr.extension &&
					     (hist.start || null) == _h.attr.start && (hist.end || null) == _h.attr.end &&
					     (hist.id || null) == _h.attr.id )
						return true;
				}
				return false;
			}
		});

	var mailbox = Api.extend( /** @lends IPCortex.PBX.mailbox.prototype */ {
			/**
			 * Construct a mailbox object.
			 * @constructs IPCortex.PBX.mailbox
			 * @augments Api
			 * @param {String} mailbox The data for the mailbox entry
			 * @protected
			 */
			construct: function(mailbox) {
				var _this = this;
				this.attr = {
						oldmsg:		0,
						newmsg:		0,
						device:		mailbox
				};
				this.hooks = [];
			},
			/* TODO: Document the local version of 'get' */
			/**
			 * Update the mailbox info.
			 * @param {Object} info Data from tmpld.pl on the mailbox
			 * @private
			 */
			update: function(info) {
				var _device = info.device;
				if ( !_device )
					return;
				var _prev = this.attr.oldmsg + ',' + this.attr.newmsg;
				if ( _device.oldMessages )
					this.attr.oldmsg = _device.oldMessages;
				if ( _device.newMessages )
					this.attr.newmsg = _device.newMessages;
				var _new = this.attr.oldmsg + ',' + this.attr.newmsg;
				if ( _prev != _new )
					this.run();
			},
			/**
			 * Run all hooks for this mailbox
			 * @private
			 */
			run:	function() {
				var _hooks = this.hooks;
				for ( var i = 0; i < _hooks.length; i++ )
					_hooks[i].run(_hooks[i].filter, _hooks[i].hid, this);
			}
		});

	var queue = Api.extend( /** @lends IPCortex.PBX.queue.prototype */ {
			/**
			 * Construct a queue object.
			 * @constructs IPCortex.PBX.queue
			 * @augments Api
			 * @param {String} queue The data for the queue entry
			 * @protected
			 */
			construct: function(queue) {
				var _this = this;
				this.attr = {
						depth:		0,
						completed:	0,
						abandoned:	0,
						lastcall:	0,
						members:	{},
						queued:		{},
						device:		queue
				};
				this.hooks = [];
			},
			stateStr: {
				0:	'unknown',
				1:	'idle',
				2:	'inuse',
				3:	'busy',
				4:	'unknown',	/* Actually illegal */
				5:	'unavailable',
				6:	'ring',
				7:	'ringinuse',    /* Both ring and inuse */
				8:	'hold'
			},
			/**
			 * Queue getter.
			 * @param {String} attr Key for data to get.
			 * One of the following String values:
			 * 
			 * 'device': returns the Queue device name of the form Queue/q_nnn
			 * 
			 * 'extension': returns the extension number for this queue
			 * 
			 * 'depth': The number of waiting calls
			 * 
			 * 'completed': Calls completed (cleared nightly)
			 * 
			 * 'abandoned': Calls abandoned (cleared nightly)
			 * 
			 * 'total': Same as q.get('completed') + q.get('abandoned')
			 * 
			 * 'members': An object containg members and their state.
			 * The members object is keyed on the device that is called (eg. SIP/queue_2)
			 * and has the following attributes:
			 *    __state__: Device state ('unknown','paused','idle','inuse','busy','unavailable','ring','ringinuse','hold')
			 *    __lastcall__: Timestamp of last call.
			 *    __numcalls__: Number of answered calls today (Total for this device across all queues)
			 *    __device__: Reference to the called device object. Use device.get('calls') to get calls.
			 * 
			 * 'calls': Calls waiting in the Queue.
			 * 
			 * 'queued': An object keyed on call-ID holding all queued calls.
			 *  
			 * @returns {*} Attribute value
			 */
			get:	function(attr) {
				if ( attr == 'extension' )
					return this.attr.device.split('_')[1];
				if ( attr == 'total' )
					return this.attr.completed + this.attr.abandoned;
				if ( this.attr[attr] )
					return this.attr[attr];
			},
			/**
			 * Update the queue info.
			 * @param {Object} info Data from tmpld.pl on the queue
			 * @private
			 */
			update: function(info) {
				var _device = info.device;
				if ( ! _device )
					return;
				this.attr.depth = _device.depth || 0;
				this.attr.completed = _device.complete || 0;
				this.attr.abandoned = _device.abandon || 0;
				this.attr.members = {};
				if ( _device.members ) {
					for ( var i = 0; i < _device.members.length; i++ ) {
						var _mem = _device.members[i];
						var _dev = _mem.location;
						this.attr.members[_dev] = {
									device:	lookUp.dev[_dev],
									state:	'unknown'
						};
						if ( _mem.paused )
							this.attr.members[_dev].state = 'paused';
						else
							this.attr.members[_dev].state = queue.stateStr[_mem.status] || 'unknown';
						if ( _mem.lastCall && _mem.lastCall > this.attr.lastcall )
							this.attr.lastcall = _mem.lastCall;
						this.attr.members[_dev].lastcall = _mem.lastCall || 0;
						this.attr.members[_dev].numcalls = _mem.callsTaken || 0;
/* No longer needed
						this.attr.members[_dev].calls = {};
						if ( lookUp.dev[_dev] ) {
							var _calls = lookUp.dev[_dev].get('calls');
							for ( var j in _calls ) {
								if( _calls[j].get('dial') == null || _calls[j].get('dial') == this.attr.device.substr(8) )
									this.attr.members[_dev].calls[j] = _calls[j];
							}
						}
*/
					}
				}
				this.run();
			},
			/**
			 * Add or remove a call on a queue
			 * @param {Object} call Data from tmpld.pl on the call
			 * @private
			 */
			queuecall: function(call, to) {
				var _id = call.get('id');
				if ( to == 'QUEUE:' + this.attr.device.substr(6) ) {
					this.attr.queued[_id] = call;
					call.attr.inq = call.attr.inq || (new Date()).getTime();
				} else {
					call.attr.outq = call.attr.outq || (new Date()).getTime();
					delete this.attr.queued[_id];
					delete lookUp.qcall[_id]
				}
				this.run();
			},
			/**
			 * Run all hooks for this mailbox
			 * @private
			 */
			run:	function() {
				var _hooks = this.hooks;
				for ( var i = 0; i < _hooks.length; i++ )
					_hooks[i].run(_hooks[i].filter, _hooks[i].hid, this);
			}
		});

	var address = Api.extend( /** @lends IPCortex.PBX.address.prototype */ {
			/**
			 * Construct an addressbook object from a number of sources.
			 * Sources can be eg.: Basic addressbook entry, a PABX contact, and XMPP user.
			 * @constructs IPCortex.PBX.address
			 * @augments Api
			 * @param {String} group The address book pane this is to be displayed under.
			 * @param {Object} item The data for the addressbook entry
			 * @protected
			 */
			construct: function(group, item) {
				var _this = this;
				this.attr = {
						group:		group,
						key:		null,
						canremove:	false,
						canedit:	false,
						isme:		false
				};
				this.hooks = [];
				this.contact = null;	/* Ref to contact object located with this.attr.cid */
				this.xmpp = null;	/* Ref to xmpp object located with this.attr.device */
				var _translate = {
						i:	'cid',
						n:	'name',
						x:	'extension',
						e:	'email',
						d:	'device',
						c:	'company',
						pa:	'pa',
						pi:	'pi'
				};
				if ( item.i ) {						/* Contact based */
					this.attr.key = item.i;
					if ( item.i == live.userData.id )
						this.attr.isme = true;
				} else if ( item.k ) {					/* CSV or personal upload */
					this.attr.key = 'a' + item.k;
					if ( group == 'personal' )
						this.attr.canremove = this.attr.canedit = true;
				} else if ( item.d && item.d.substr(0,6) == "Custom" )	/* Device based (XMPP) */
					this.attr.key = item.d;
				else if ( item.h ) {					/* Remote sync sourced */
					var _s = item.h.split('_');
					if ( live.md5Hash[_s[0]] && parseInt(_s[1]) )
						this.attr.key = live.md5Hash[_s[0]] + '_' + _s[1];
				} else if ( item.x )					/* Extension, no contact */
					this.attr.key = 'e' + item.x + '_' + (item.c || 'default');
				else if ( item.pa )					/* Park */
					this.attr.key = 'p' + item.pa + '_' + (item.c || 'default');
				else if ( item.pi )					/* Pickup */
					this.attr.key = 'p' + item.pi + '_' + (item.c || 'default');
				else {
					console.log("Addressbook item with no key!!! FIXME!");
					console.log(item);
				}
				if ( item.C && live.md5Hash[item.C] ) /* Additional company name info */
					this.attr.companyName = live.md5Hash[item.C];
				for ( var _key in item )
					if ( _translate[_key] )
						this.attr[_translate[_key]] = item[_key];

				/* Park and Pickup */
				if ( item.pa ) {
					this.attr.name = 'Park';
					this.attr.extension = item.pa;
				}
				if ( item.pi ) {
					this.attr.name = 'Pickup ' + item.pi;
					this.attr.device = 'Park/' + item.pi;
					this.attr.extension = item.pi;
				}

				/* We have a cid, so cache name/extension so we can detect changes */
				if( this.attr.cid && getUser(this.attr.cid) ) {
					this.attr.name = getUser(this.attr.cid)['name'] || null;
					this.attr.extension = getUser(this.attr.cid)['extension'] || null;
				}
				this._getRefs();
			},
			/**
			 * Ensure that this.xmpp and this.contact are up to date.
			 * @private
			 */
			_getRefs:	function() {
				if ( ! this.contact && ! isNaN(this.attr.cid) && lookUp.cnt[this.attr.cid] )
					this.contact = lookUp.cnt[this.attr.cid];
				if ( !this.xmpp && this.attr.device && this.attr.device.search(/^Custom\/.+@.+$/) != -1 )
					this.xmpp = lookUp.xmpp[this.attr.device];
			},
			/**
			 * Get attribute from address. This will fetch data from the underlying
			 * contact/contcat-xmpp/contact-device/xmpp/park-orbit.
			 * 
			 * @param {String} attr 
			 * One of the following String values:
			 * 
			 * 'blf': returns a number with one of the following Number values:
			 * __0__: idle
			 * __1__: busy
			 * __2__: ringing
			 * __3__: busy + ringing
			 * 
			 * 'phone' or 'cancall': returns Bool - Phone callable
			 * 
			 * 'online' or 'canchat': returns Bool - Chat online (chatable)
			 * 
			 * 'show': returns String - Selected online status ( '' | 'online' | 'dnd' | 'away')
			 *  
			 * 'xmpp': returns Object containing 'show' and 'status' values for XMPP state that has been set via the API.
			 * 
			 * 'states': returns Object keyed on XMPP resource containing 'show', 'status' and 'desc' for each. It will
			 * include the values from 'xmpp' above after a short processing delay.
			 * 
			 * 'canedit' and 'canremove': return Bool - Can this entry be removed or edited respectively.
			 * 
			 * @returns {*} Attribute value
			 */
			get:	function(attr) {
				var _value = null;
				var _default = {
						blf:	0,
						online: false,
						phone:	false,
						show:	''
				};
			/* Fake phone online status for Park / Non-accessible devices. */
				if ( attr == 'cancall' )
					attr = 'phone';
				if ( attr == 'canchat' )
					attr = 'online';
				if ( attr == 'phone' ) {
					if ( this.attr.pa || this.attr.pi )
						return true;	    /* Park/Pick, always online */
					if ( this.attr.extension ) {
						var _ext = this.attr.extension;
						if ( ! this.attr.cid ) {
							/* Not associated with a user, online when any called device is ok */
							if ( extByExt[_ext] && extByExt[_ext].type != 'A' && extByExt[_ext].type != 'H' )
								return true;
							/* Does not appear to be an extension, appear online */
							if ( !extToDev[_ext] )
								return true;
							/* Not associated with a phone, online if from another company (no other data available) */
							if ( this.attr.company != live.userData.home && extToDev[_ext].length == 0 )
								return true;
							/* If any callable phone is callable, appear online */
							for ( var i = 0; i < extToDev[_ext].length; i++ ) {
								if ( lookUp.dev[extToDev[_ext][i]] && lookUp.dev[extToDev[_ext][i]].attr.status == 'up' )
									return true;
							}
							return false;
						}
/* TODO: Next 2 lines are experimental - Not sure if they are correct yet! */
						if ( this.contact )
							return this.contact.get(attr);
						if ( ! getUser(this.attr.cid)['phone'] )
							return true;
					} else if ( this.attr.device && this.attr.device.search(/^Custom.*@/) != -1 )
							return false;	/* XMPP devices are non-callable */
					var _u = getUser(this.attr.cid);
					var _d = (macToPhn[_u.phone + '' + _u.port] || {devices:[]}).devices[0];
/* TODO: Hotdesk user's handset status ??? */
					if ( ! lookUp.dev[_d] )
						return true;	    /* Not a handset we can access, always online */
				}
			/* Special meanings for photo */
				if ( attr == 'photo' ) {
					_value = live.origURI + live.origHostPort + '/api/image.whtm/';
					if ( this.attr.cid )
						return _value + this.attr.cid + '/';
					else if ( this.attr.device && this.attr.device.search(/^Custom.*@/) != -1 )
						return _value + this.attr.device.substr(7) + '/';

				}
				if ( attr == 'companyName' && this.attr.companyName == null )
					return live.companies[this.get('company')] || ''
				if ( attr.search(/^(group|key|name|extension)$/) != -1 )
					if ( this.attr[attr] != null )
						return this.attr[attr];

				this._getRefs();
				if ( this.contact )
					_value = this.contact.get(attr);
				else if ( this.xmpp )
					_value = this.xmpp.get(attr);
				else if ( this.parkHid && lookUp.dev[this.attr.device] )
					_value = lookUp.dev[this.attr.device].get(attr);
				if ( _value == null ) {
					if( this.attr.cid && getUser(this.attr.cid) )
						_value = getUser(this.attr.cid)[attr];
					else
						_value = this.attr[attr];
				}
				_value = _value || this.attr[attr];
				return _value == null ? _default[attr] : _value;
			},
			/**
			 * Merge an updated copy of this entity into this version of myself.
			 * 
			 * At present, if there is no contact, return false.
			 * 
			 * @param {IPCortex.PBX.address} other The address object to merge.
			 * @private
			 */
			merge:	function(other) {
				var _merge = {
						'name':		true,
						'extension':	true,
						'email':	true,
						'device':	true,
						'company':	true,
						'companyName':	true,
						'pi':		true,
						'pa':		true
				};
				for ( var _key in other.attr )
					if ( _merge[_key] )
						this.attr[_key] = other.get(_key);

				/* Park and Pickup */
				if ( other.get('pa') ) {
					this.attr.name = 'Park';
					this.attr.extension = other.get('pa');
				}
				if ( other.get('pi') ) {
					this.attr.name = 'Pickup ' + other.get('pi');
					this.attr.device = 'Park/' + other.get('pi');
					this.attr.extension = other.get('pi');
				}
			},
			/**
			 * Add a new hook to this addressBook entity. This is a pseudo-hook that actually hooks the
			 * underlying contact entity. 
			 * 
			 * At present, if there is no contact, return false.
			 * 
			 * @param {Callback~addressbookCB} hook The callback function for running this hook
			 * @private
			 */
			hook:	function(callback) {
				var _this = this;
				function update(filter, hid, thing) {
					_this.run(filter, hid, _this);
				}

				/* This is a contact type addressbook entry */
				if ( ! this.contactHid && ! isNaN(this.attr.cid) ) {
					var _tmp = hookContact(this.attr.cid, update);
					if ( _tmp > 0 && lookUp.hid[_tmp] )
						this.contactHid = _tmp;
				}

				/* Handle non contact that is XMPP-able */
				if ( !this.xmppHid && this.attr.device && this.attr.device.search(/^Custom\/.+@.+$/) != -1 )
					this.xmppHid = hookXmpp(this.attr.device, update);

				/* Handle a Park orbit */
				if ( ! this.parkHid && this.attr.device && this.attr.device.search(/^Park\/\d+$/) != -1 ) {
					this.parkHid = hookPark(this.attr.device, update);
				}

				/* We already hooked stuff above, so just add this callback to our list
				 * need to create a new gHid for that */
				gHid++;
				lookUp.hid[gHid] = [this];
				this.hooks.push({run: callback, hid: gHid});

				var _fil = {};
				var _hid = gHid;
				function initialCB() {
					callback(_fil, _hid, _this);
				}
				setTimeout(initialCB, 1);
				return gHid;
			},
			/**
			 * Special unhook method for address entry
			 * @param {Number} hid Hook ID number to remove
			 * @private
			 */
			unhook:	function(hid) {
				if ( ! this.hooks )
					return;
				for ( var i = this.hooks.length - 1; i >= 0; i-- ) {
					if ( this.hooks[i].hid == hid )
						this.hooks.splice(i, 1);
				}
				if ( this.hooks.length == 0 ) {
					if ( this.contactHid )
						unHook( this.contactHid );
					if ( this.xmppHid )
						unHook( this.xmppHid );
					if ( this.parkHid )
						unHook( this.parkHid );
					this.contactHid = null;
					this.xmppHid = null;
					this.parkHid = null;
				}
			},
			/**
			 * Run all hooks on this addressBook entity.
			 * @param {Object} filter Describes the filter used to generate this hook eg. {cid: contactID, name: Name}
			 * @param {Number} hid Hook ID number, passed to hook as 2nd parameter
			 * @param {IPCortex.PBX.contact|*} thing Ref to class that fired the hook.
			 * @private
			 */
			run:	function(filter, hid, thing) {
				var _hooks = this.hooks;
				for ( var i = 0; i < _hooks.length; i++ )
					_hooks[i].run(filter, hid, this);
			},
			/**
			 * Compare this addressbook entry to the supplied one
			 * @param {IPCortex.PBX.address} b Address entry to compare
			 * @return {Bool} true if the items are the same.
			 * @private
			 */
			compare: function(b) {
				var a = this;
				if ( b == null )
					return false;
				if ( a.get('group') != b.get('group') ) 
					return false;
				if ( a.get('company') != b.get('company') )
					return false;
				if ( a.get('companyName') != b.get('companyName') )
					return false;
				if ( a.get('name') != b.get('name') )
					return false;
				if ( a.get('extension') != b.get('extension') )
					return false;
				if ( a.get('device') != b.get('device') )
					return false;
				if ( a.get('email') != b.get('email') )
					return false;
				return true;
			},
			/**
			 * Helper function for sorting addressbook entries.
			 * @param {IPCortex.PBX.address} b Address entry to compare
			 * @return {Number} -1, 0, 1 depending on the difference.
			 * @private
			 */
			sortFn: function(b) {
				var a = this;
				var _groups = {system: 1, company: 2, personal: 3, chat: 4};
				if ( b == null )
					return -1;
				if ( _groups[a.get('group')] < _groups[b.get('group')] ) 
					return -1;
				if ( _groups[a.get('group')] > _groups[b.get('group')] ) 
					return 1;
				if ( a.get('company') == _user.company && b.get('company') != _user.company )
					return -1;
				if ( a.get('company') != _user.company && b.get('company') == _user.company )
					return 1;
				if ( a.get('name') < b.get('name') )
					return -1;
				else if ( a.get('name') > b.get('name') )
					return 1;
				if ( a.get('extension') < b.get('extension') )
					return -1;
				else if ( a.get('extension') > b.get('extension') )
					return 1;
				return 0;
			},
			/**
			 * Request permission to receive far end's XMPP state.
			 */
			xmppReq:	function() {
				this._getRefs();
				if ( this.contact )
					return this.contact.xmppReq();
				else if ( this.xmpp )
					return this.xmpp.xmppReq();
				return PBXError.XMPP_NO_CONTACT;
			},
			/**
			 * Auth far end to see my XMPP state.
			 */
			xmppAuth:	function() {
				this._getRefs();
				if ( this.contact )
					return this.contact.xmppAuth();
				else if ( this.xmpp )
					return this.xmpp.xmppAuth();
				return PBXError.XMPP_NO_CONTACT;
			},
			/**
			 * De-Auth far end to see my XMPP state.
			 */
			xmppDel:	function() {
				this._getRefs();
				if ( this.contact )
					return this.contact.xmppDel();
				else if ( this.xmpp )
					return this.xmpp.xmppDel();
				return PBXError.XMPP_NO_CONTACT;
			},
			/**
			 * Start a chat between the logged in user and this addressbook contact.
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 */
			chat:	function(callback) {
				this._getRefs();
				if ( this.contact )
					return this.contact.chat(callback);
				else if ( this.xmpp )
					return this.xmpp.chat(callback);
				return PBXError.CHAT_NO_CONTACT;
			},
			/**
			 * Delete this address record. Only deletes CSV/personal entries. Triggers an address callback.
			 */
			remove:	function() {
				var _this = this;
				var _key = this.attr.key;
				if ( _key.search(/^a[0-9]+$/) == -1 ) {
					if ( this.get('roster') != null )
						return this.xmppDel();
					return PBXError.ADDR_CANNOT_DEL;
				}
				function parseResult(content) {
					if ( content.search(/<response.*result="success"/) != -1 ) {
						setTimeout( function() { if ( callbacks.getAddressbook ) callbacks.getAddressbook([], [_key]); }, 1 );
						delete lookUp.addr[_key];
						_this.destroy();    /* This should auto-protect any referenced subclasses */
					} else	/* Something out of sync - Recover... */
						getAddressbook();
				}
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=delete&type=address&key=' + _key.substr(1) , parseResult);
				return 0;
			},
			/**
			 * Edit this address record. Only edits CSV/personal entries. Triggers an address callback.
			 */
			edit:	function(name, number, photo) {
				var _this = this;
				var _key = this.attr.key;

				function parseResultPhoto(content) {
					if ( content.search(/<response.*result="success"/) != -1 ) {
						setTimeout( function() { if ( callbacks.getAddressbook ) callbacks.getAddressbook([_this], []); }, 1 );
					} else {
						/* Photo upload failed. What to do ?... */
					}
				}
				if ( photo ) {
					if ( !live.userData || live.userData.id != this.attr.key )
						return PBXError.ADDR_PHOTO_PERM;
					if ( typeof window.FormData == 'function' ) {
						if ( typeof photo != 'string' || photo.substr(0,5) != 'data:' )
							return PBXError.ADDR_PHOTO_BAD;
						if ( photo.substr(5,9) != 'image/png' && photo.substr(5,9) != 'image/gif' && photo.substr(5,9) != 'image/jpg' )
							return PBXError.ADDR_PHOTO_FMT;
						var FD = new FormData();
						FD.append('cmd', 'upload');
						FD.append('type', 'photo');
						FD.append('img', photo);
						Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', FD, parseResultPhoto);
					} else
						return PBXError.ADDR_PHOTO_NOSUPP;

					if ( !name && ! number )	/* Only a photo edit, so return OK */
						return 0;
				}

				/* 'canedit' determines whether name/number can be changed */
				if ( _key.search(/^a[0-9]+$/) == -1 || ! this.attr.canedit )
					return PBXError.ADDR_CANNOT_EDIT;

				function parseResult(content) {
					if ( content.search(/<response.*result="success"/) != -1 ) {
						_this.attr.name = _name;
						_this.attr.extension = _number;
						setTimeout( function() { if ( callbacks.getAddressbook ) callbacks.getAddressbook([_this], []); }, 1 );
					} else	/* Something out of sync - Recover... */
						getAddressbook();
				}
				var _name = name || '';
				var _number = number || '';
				if ( _number.length == 0 && _name.length == 0 )
					return PBXError.ADDR_EDIT_NUMNAME;
				if ( _number.length == 0 )
					return PBXError.ADDR_EDIT_NUM;
				if ( _name.length == 0 )
					return PBXError.ADDR_EDIT_NAME;
				_number = _number.replace(/ /g, '');
				if ( _number.search(/[^0-9\#\*]/) != -1 )
					return PBXError.ADDR_E_ILLEGAL_NUM;
				if ( _name.search(/[^a-zA-Z0-9\.\s\,\'\/\\\-_]/) != -1 )
					return PBXError.ADDR_E_ILLEGAL_NAME;

				/* If no change, do nothing but return OK */
				if ( _name == this.attr.name && _number == this.attr.extension )
					return 0;
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=edit&type=address&key=' + _key.substr(1) +
											'&name=' + _name +
											'&number=' + _number , parseResult);
				return 0;
			}
			
		});


	var contact = Api.extend( /** @lends IPCortex.PBX.contact.prototype */ {
			/**
			 * When you hook a contact or an addressbook entry that is a contact, a contact entity is created.
			 * 
			 * This contact entity auto-hooks XMPP and owned phone for updates
			 * 
			 * @constructs IPCortex.PBX.contact
			 * @augments Api
			 * @param {String} cid Contact ID
			 * @protected
			 */
			construct: function(cid) {
				var _this = this;
				function update() {
					_this.update();	
				}
				this.attr = {
						blf:		0,
						cid:		cid,
						phone:		false
				};
				this.xmpp = null;
				this.hooks = [];
				this.devices = [];
				this.hid = {
						xmpp: hookXmpp(cid, update),
						device: hookDevice(null, [cid], null, null, true, update),
						owned: null
				};
				if ( this.hid.xmpp > 0 )
					this.xmpp = lookUp.hid[this.hid.xmpp][0];
				else
					this.hid.xmpp = null;

				/* Contact owns a phone, but might not call it, so add a special hook if not already hooked */
				var _ownDev = null;
				var _usr = live.cidToUsr[this.attr.cid];
				if ( _usr.phone ) {
					var _macAndPort = _usr.phone + '' + _usr.port;
					if ( macToPhn[_macAndPort] && macToPhn[_macAndPort].devices )
						_ownDev = macToPhn[_macAndPort].devices[0];
				}
				if ( this.hid.device > 0 ) {
					for ( var i = 0; i < lookUp.hid[this.hid.device].length; i++ ) {
						this.devices.push(lookUp.hid[this.hid.device][i]);
						if ( lookUp.hid[this.hid.device][i].attr.device == _ownDev )
							_ownDev = null;
					}
				} else
					this.hid.device = null;
				if ( _ownDev && lookUp.dev[_ownDev] )
					this.hid.owned = lookUp.dev[_ownDev].hook(update);
			},
			/**
			 * Contact hook method - Same as normal hook but runs child hooks too.
			 * @param {function} hook The callback function for running this hook
			 * @param {Object} filter Describes the filter used to generate this hook {roomID: roomID}
			 * @param {Number} hid Hook ID number, passed to hook as 2nd parameter
			 */
			hook:	function(callback, filter, hid) {
				if ( ! hid ) {
					gHid++;
					lookUp.hid[gHid] = [this];
					hid = gHid;
				}
				if ( ! filter )
					filter = {};

				if ( Array.isArray(this.hooks) )
					this.hooks.push({run: callback, filter: filter, hid: hid});

				var _this = this;
				function initialCB() {
					if ( _this.xmpp )
						_this.xmpp.run();
					if ( _this.devices ) {
						for ( var i = 0; i < _this.devices.length; i++ )
							_this.devices[i].run();
					}
				}
				setTimeout(initialCB, 1);

				return hid;
			},
			/**
			 * Get attribute from contact. This will fetch data from the underlying
			 * contact/contcat-xmpp/contact-device.
			 * 
			 * @param {String} attr 
			 * One of the following String values:
			 * 
			 * 'cid': returns contact ID.
			 * 
			 * 'blf': returns a number with one of the following Number values:
			 * __0__: idle
			 * __1__: busy
			 * __2__: ringing
			 * __3__: busy + ringing
			 * 
			 * 'phone': returns Bool - Phone callable
			 * 
			 * 'online': returns Bool - Chat online (chatable)
			 * 
			 * 'show': returns String - Selected online status ( '' | 'online' | 'dnd' | 'away')
			 *  
			 * 'xmpp': returns Object containing 'show' and 'status' values for XMPP state that has been set via the API.
			 * 
			 * 'states': returns Object keyed on XMPP resource containing 'show', 'status' and 'desc' for each. It will
			 * include the values from 'xmpp' above after a short processing delay.
			 * 
			 * @returns {*} Attribute value
			 */
			get:	function(attr) {
				var _u = getUser(this.attr.cid);
				if ( attr == 'xmppid' && this.xmpp /* && _u */ )
					return this.attr.cid;		 /* was  _u.uname */
				if ( this.xmpp && attr.search(/(show|xmpp|online)/) != -1 )
					return this.xmpp.get(attr);
				if ( this.xmpp && (attr == 'states' || attr == 'roster') )
					return this.xmpp.get(attr);
				if ( this.attr[attr] != null )
					return this.attr[attr];
				if ( attr == 'companyName' )
					return live.companies[this.get('company')] || ''
				if ( _u )
					return _u[attr];
				return null;
			},
			/**
			 * Run all hooks on this contact entity
			 * @private
			 */
			run:	function() {
				var _hooks = this.hooks;
				for ( var i = 0; i < _hooks.length; i++ )
					_hooks[i].run(_hooks[i].filter, _hooks[i].hid, this);
			},
			/**
			 * An XMPP (state) or device (BLF) update has occurred.
			 * @private
			 * @todo Currently we do not check what called us... Can't be that hard!
			 */
			update:	function() {
				var _blf = 0;
				this.attr.phone = null;
				var up = {owned: null, hotdesk: null, webrtc: null}

				/* Roll in any hotdesk BLF state. */
				var _hdDev = null;
				var _usr = live.cidToUsr[this.attr.cid];
				if ( _usr.phone ) {
					var _macAndPort = _usr.phone + '' + _usr.port;
					if ( macToPhn[_macAndPort] && macToPhn[_macAndPort].devices ) {
						_hdDev = live.hotdesk_owner[macToPhn[_macAndPort].devices[0]];
						if ( _hdDev && lookUp.dev[_hdDev] ) {
							_blf |= lookUp.dev[_hdDev].get('blf');
							up.hotdesk = (lookUp.dev[_hdDev].get('status') == 'up');
						}
					}
				} else if ( _usr.extension ) {
					_hdDev = live.hotdesk_owner['Hotdesk/' + _usr.extension];
					if ( _hdDev && lookUp.dev[_hdDev] ) {
						_blf |= lookUp.dev[_hdDev].get('blf');
						up.hotdesk = (lookUp.dev[_hdDev].get('status') == 'up');
					}
				}
				/* Re-roll-up BLF for all devices to this contact
				 * Exclude any line that has been hotdesked over.
				 */
				for ( var i = 0; i < this.devices.length; i++ ) {
					/* We have at least one device so change starting assumption */
					if ( this.attr.phone == null )
						this.attr.phone = true;
					/*
					 * We are hotdesked over, regular blf data is not used for us
					 * instead use special-case blf for non-HD only BLF if available
					 */
					if ( ! live.hotdesked_to[this.devices[i].get('device')] )
						_blf |= this.devices[i].get('blf');
					else
						_blf |= this.devices[i].get('blf_no_hd') || 0;

					if ( this.devices[i].get('device').substr(0,10) == 'SIP/webrtc' )
						up.webrtc = (this.devices[i].get('status') == 'up');
					else if ( ! _hdDev || _hdDev != this.devices[i].get('device') ) {
						if ( this.devices[i].get('status') != 'up' )
							up.owned = false;
						else if ( up.owned == null )
							up.owned = true;
					}
				}
/* Our response be if there is no owned phone? If any callable phone from owned extension is callable, appear online */
				if ( up.webrtc == null && up.hotdesk == null && up.owned == null ) {
					this.attr.phone = false;
					for ( var i = 0; _usr.extension && extToDev[_usr.extension] && i < extToDev[_usr.extension].length; i++ ) {
						if ( lookUp.dev[extToDev[_usr.extension][i]] && lookUp.dev[extToDev[_usr.extension][i]].attr.status == 'up' )
							this.attr.phone = true;
					}
// console.log('update no owned (', this.attr.cid, _usr.name, ') ext', _usr.extension, this.attr.phone);
				} else if ( this.attr.phone == null && ! _hdDev ) {
// console.log('update no phone/no HD (', this.attr.cid, _usr.name, ') ext', _usr.extension, this.attr.phone);
					this.attr.phone = false;
				} else {
					this.attr.phone = (!!up.webrtc || !!up.hotdesk || !!up.owned );
// console.log('update: ', up.webrtc ? 'webrtc' : '', up.hotdesk ? 'hotdesk' : '', up.owned ? 'owned' : '', '(', this.attr.cid, _usr.name, ') ext', _usr.extension, this.attr.phone);
// console.log('_blf ', _blf);
				}
				this.attr.blf = _blf;

				this.run();
			},
			/**
			 * Request permission to receive far end's XMPP state.
			 */
			xmppReq:	function() {
				if ( this.xmpp )
					return this.xmpp.xmppReq();
				return PBXError.XMPP_NO_CONTACT;
			},
			/**
			 * Auth far end to see my XMPP state.
			 */
			xmppAuth:	function() {
				if ( this.xmpp )
					return this.xmpp.xmppAuth();
				return PBXError.XMPP_NO_CONTACT;
			},
			/**
			 * De-Auth far end to see my XMPP state.
			 */
			xmppDel:	function() {
				if ( this.xmpp )
					return this.xmpp.xmppDel();
				return PBXError.XMPP_NO_CONTACT;
			},
			/**
			 * Create a new chat room with this contact
			 * @param {Function} [callback] Optional callback called with true/false can be used to get immediate failure result.
			 */
			chat:	function(callback) {
				if ( this.attr.cid == live.userData.id )
					return PBXError.CHAT_SELF_REFUSED;
				if ( ! this.get('online') )
					return PBXError.CHAT_USER_OFFLINE;
				return room.requestNew(this.attr.cid, callback);
			}
		});

	/**
	 * Called when the first chunks of data are returned from api.whtm during initialisation.
	 * Carries out initial conversion of compacted data into useful structures.
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function feedMangle() {
		deviceToExtension();

		for ( var _ext in live.extToCid ) {
			var _num = _ext.split('_')[0];
			var _scope = _ext.split('_')[1];
			if ( ! extByExt[_ext] ) {
				extByExt[_ext] = {
						type:		live.extToCid[_ext].t,
						company:	live.extToCid[_ext].c,
						name:		live.extToCid[_ext].n,
						voicemail:	live.extToCid[_ext].v,
						priority:	live.extToCid[_ext].p,
						owner:		false,
						canopt:		(live.extToCid[_ext].t.search(/^[AHQ]$/) != -1)
				};
				var _cList = live.extToCid[_ext].l || [];
				for ( var i=0; i < _cList.length; i++ ) {
					if ( _cList[i].o ) {
						extByExt[_ext].owner = _cList[i].i;
						break;
					}
				}
			}
		}

		macToPhn = {};
		devToMac = {};
		webrtcPass = {};
		for ( var _cid in live.cidToPhn ) {
			var _pList = live.cidToPhn[_cid];
			for ( var i = 0; i < _pList.length; i++ ) {
				if ( _pList[i].w )
					webrtcPass[_pList[i].d] = _pList[i].w;
				var _macAndPort = _pList[i].m + '' + _pList[i].p;
				if ( ! macToPhn[_macAndPort] ) {
					macToPhn[_macAndPort] = {
							name:		_pList[i].d,
							features:	_pList[i].f,
							devices:	[],
							owner:		((_pList[i].o || (_pList[i].d == 'webrtc' + _cid )) ? _cid : false)
					};
					for ( var n = 0; n < _pList[i].n; n++ ) {
						macToPhn[_macAndPort].devices.push('SIP/' + _pList[i].d + ((n + 1) > 1 ? '_' + (n + 1) : ''));
						devToMac['SIP/' + _pList[i].d + ((n + 1) > 1 ? '_' + (n + 1) : '')] = _macAndPort;
					}
				} else if ( _pList[i].o )
					macToPhn[_macAndPort].owner = _cid;
			}
		}
		for ( var _cid in live.cidToUsr ) {
			var _translate = {
					c:	'company',
					i:	'cid',
					x:	'extension',
					m:	'phone',
					n:	'name',
					p:	'port',
					u:	'uname',
					e:	'email'
			};
			for ( var _key in _translate ) {
				if ( live.cidToUsr[_cid][_key] == null )
					continue;
				live.cidToUsr[_cid][_translate[_key]] = live.cidToUsr[_cid][_key];
				delete live.cidToUsr[_cid][_key];
			}
			live.cidToUsr[_cid].company = live.cidToUsr[_cid].company || '';
		}

		/* After mangling the data, call getLines() - If this is an update,
		  there will be a callback set and the UI will be called.
		*/
		getLines();
	}

	/**
	 * Called when the first chunks of data are returned from api.whtm during initialisation.
	 * and after feedMangle. Kicks off the once-per-second poll to tmpld.pl
	 * @memberOf IPCortex.PBX
	 * @private
	 */
	function initAPI() {
		aF.queue.push(live.origURI + live.origHost + ':' + live.scriptPort + '/' + ((new Date()).getTime()) + '/?closeconnection=1&clearchat=1');
		intervalID = setInterval(checkInterval, 1000);
	}


	/**
	 * @namespace IPCortex.PBX.Auth
	 * @description Container for all authentication operations
	 */
	var PBXAuth = {
		/**
		 * If the IPCortex.PBX is running on one host and the PABX is separate, the IPCortex.PBX must be told how to access the PABX.
		 * 99% of the time, this will happen automatically using the source of the original request for API files. In the exceptional
		 * case, this call can be used to override the target.
		 * 
		 * @param {String} host Fully qualified host name, or IP address of the PABX.
		 * May also optionally include http[s]:// prefix and :port suffix
		 * @memberOf IPCortex.PBX.Auth
		 * @example // Use pabx.mydomain.local for auth 
		 * IPCortex.Auth.setHost('pabx.mydomain.local');
		 * IPCortex.Auth.setHost('https://pabx.mydomain.local:1234');
		 */
		setHost: function(host) {
			var a = host.split(':');
			if ( a[0] == 'http' || a[0] == 'https' ) {
				live.origURI = a[0] + '://';
				live.scriptPort = (a[0] == 'https' ? ports.tmplds : ports.tmpld);
				a.shift();
				a[0] = a[0].substr(2);	/* Remove remaining '//' */
			}
			live.origHostPort = live.origHost = a[0];
			if ( a[1] )
				live.origHostPort += ':' + a[1];
		},
		/**
		 * Auth callback to indicate login complete or failed.
		 * @callback Callback~authCB
		 * @param {Bool} code true: Auth OK, false: Auth failed
		 */
		/**
		 * Attempt to login, the result is determined asynchronously and a callback
		 * is called with a true/false parameter.
		 * 
		 * This is required before any other API calls can be made.
		 * 
		 * If authentication is successful, userID and username are stored.
		 * 
		 * @param {String} username username to log in as. If username and password are both null, a login
		 * check is carried out, so if the user is already logged-in, it responds as if just logged-in as
		 * that user.
		 * @param {String} password password for the user, or null (see above)
		 * @param {Bool} [insecure] true: use http, false: use https, null: attempt to be automatic
		 * 
		 * 'insecure' = false will cause authentication to fail with most browsers if the certificate on the PABX
		 * is unrecognised. 
		 * 
		 * 'insecure' = null will attempt to follow the parent frame/window's http/https setting.
		 * 
		 * A certificate which is signed by a CA which is acceptable to the client browser must
		 * be installed if insecure=false is used, and this is recommended in any production environment. 
		 * @param {Callback~authCB} [callback] After auth is complete, this callback will be called
		 * @memberOf IPCortex.PBX.Auth
		 * @example // login using username "fred", password "password" using http (insecure), with a callback
		 * function authCB(status){ console.log('Auth: '+((status == true)?'succeeded':'failed')+'\n'); };
		 * IPCortex.PBX.Auth.login('fred', 'password', true, authCB);
		 */
		login:	function(username, password, insecure, callback) {
			if ( typeof username == 'function' && !password && !insecure && !callback ) {
				callback = username;
				username = password = insecure = null;
			}
			var _res = false;
			function parseLogin(xml) {
				var m;
				live.userData = {};
				if ( (m = xml.match(/user .*id="(\d+)".*/)) ) {
					live.userData.id = m[1];
				}
				if ( (m = xml.match(/user .*login="([^"]*)".*/)) ) {
					live.userData.login = m[1];
				}
				if ( (m = xml.match(/user .*name="([^"]*)".*/)) ) {
					live.userData.name = m[1];
				}
				if ( (m = xml.match(/user .*company="([^"]*)".*/)) ) {
					live.userData.company = m[1];
				}
				if ( (m = xml.match(/user .*home="([^"]*)".*/)) ) {
					live.userData.home = m[1];
				}
				live.userData.home = live.userData.home || 'default';
				var perms = {};
				var lines = xml.split('\n');
				while ( lines.length ) {
					var line = lines.shift();
					if ( (m = line.match(/action .*name="([^"]+)".*/)) ) {
						perms[m[1]] = (line.indexOf('company="true"') == -1) ? 'yes' : 'company';
					}
				}
				live.userData.perms = perms;
				_res = live.userData.id != null;
				setTimeout(do_Cb, 1);
			}
			function do_Cb() {
				if ( typeof callback == 'function' )
					callback(_res);
			}
			if ( insecure == null )
				insecure = (live.origURI != 'https://');
			Utils.httpPost( (insecure ? 'http://' : 'https://') + live.origHostPort + '/api/api.whtm', 'cmd=login' +
						'&sessionUser=' + (username || '') +
						'&sessionPass=' + (password || ''), parseLogin );
		},
		rtcreset:
			function() {
				if ( webrtcPass['webrtc' + live.userData.id] )
					Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=rtcreset&pass=' + webrtcPass['webrtc' + live.userData.id]);
			},
		exit:
			function() {
				var _qs = 'cmd=exit';
				var _history = _getHistory();
				if ( cH.online )
					_qs += '&offline=1';
				if ( _history )
					_qs += '&history=' + _history;
				if ( loadCache.ocm2config )
					_qs += '&ocm2config=' + base64encode(loadCache.ocm2config);
				if ( webrtcPass['webrtc' + live.userData.id] )
					_qs += '&pass=' + webrtcPass['webrtc' + live.userData.id];
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', _qs);
			},
		/**
		 * Log out of the API. This will also cause a stopPoll(), a disableChat()
		 * and will kill the addressBook callback and flush most user-loaded data.
		 * 
		 * The polling process may be able to continue un-impeded in the background
		 * using cached credentials for up to 60 seconds, but an attempt is made to
		 * stop it.
		 * 
		 * User info is cleared.
		 * 
		 * @memberOf IPCortex.PBX.Auth
		 */
		logout:	
			function() {
				stopPoll();
				disableChat();
				disableHistory();
				flushAddressbook();
				Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=logout');
				var _keep = {
					hdCID:		null,
					origSID:	live.origSID,
					origURI:	live.origURI,
					origHost:	live.origHost,
					origHostPort:	live.origHostPort,
					scriptPort:	live.scriptPort
				};
				for ( var _key in live ) {
					if ( _keep[_key] )
						live[_key] = _keep[_key];
					else
						live[_key] = {};
				}
				loadCache = {};
			},
		/**
		 * 
		 * An object which contains all of the authentication level information that
		 * the PBX knows about the user. 
		 * 
		 * @typedef {Object} IPCortex.PBX.Auth~userData
		 * @property {Number} id Contact ID
		 * @property {String} name Contact name
		 * @property {String} company Currently selected company name or 'default' 
		 * @property {String} home Logged-in user's home company.
		 * @property {Object} perms Index of allowed permissions eg. ocm:"yes" or comp:"company". If the
		 * permission is a per-company permission, "yes" means not for the current company and "company"
		 * means yes and okay for current company.
		 * if user is in Default company.
		 */
		/**
		 * Fetch information on the currently logged-in user
		 * @returns {IPCortex.PBX.Auth~userData} An auth userdata object containing basic user information
		 * @memberOf IPCortex.PBX.Auth
		 * @example // Login and get company name
		 * function authCB(status){ 
		 *   if(status == true){
		 *     var userData = IPCortex.PBX.getUserInfo();
		 *     console.log('User: '+userData.name+' Logged in with Company: '+userData.company+'\n');
		 *   }
		 * }
		 * IPCortex.PBX.Auth.login('fred', 'password', true, authCB);
		 */
		getUserInfo: function() {
			return live.userData;
		},
		/**
		 * Some PABX functions operate on a specific company. If the user has rights to more
		 * than one, then this ensures that the correct one is selected.
		 * 
		 * The currently selected company will be stored in userdata.
		 * 
		 * @param {String} company ID of the company to select
		 * 
		 * @memberOf IPCortex.PBX.Auth
		 * 
		 */
		selcompany: function(company) {
			function parseCompany(xml) {
				var m;
				if ( (m = xml.match(/user .*company="([^"]*)".*/)) ) {
					live.userData.company = m[1];
				}
				if ( (m = xml.match(/user .*home="([^"]*)".*/)) ) {
					live.userData.home = m[1];
				}
			}
			Utils.httpPost(live.origURI + live.origHostPort + '/api/api.whtm', 'cmd=selcompany&company=' + company, parseCompany );
		}
	};

	/**
	 * @namespace IPCortex.PBX.Ops
	 * @todo all of the summary screen operations. (Separate IPCortex.PBX.Ops namespace?)
	 * @description Container for all operations for summary screen
	 */
	var PBXOps = {

	};

	/**
	 * @namespace IPCortex.PBX.errors
	 * @description Container for all PBXError codes for summary screen. Allows forward and reverse lookup.
	 * @todo Persuade jsDoc3 to document the following:
	 */
	var PBXError = {
		0:	['OK',			'No error'],
		'-100':	['CHAT_NO_CONTACT',	'Chat target has no contact'],
		'-101':	['CHAT_NO_ROSTER',	'Chat target not found in roster'],
		'-102':	['CHAT_SELF_REFUSED',	'Chat - Cannot chat to self'],
		'-103':	['CHAT_USER_OFFLINE',	'Chat target is offline'],
		'-104':	['CHAT_ALREADY_JOINED',	'Join attempt ignored, already joined'],
		'-105':	['CHAT_ALREADY_LINKED',	'Link attempt ignored, already linked'],
		'-106':	['CHAT_INVALID_CONTACT','Invalid user info - cannot add to room'],
		'-107':	['CHAT_INVALID_MOBILE',	'Invalid user mobile no. - cannot add to room'],
		'-108':	['CHAT_INVALID_EMAIL',	'Invalid user email - cannot add to room'],
		'-109':	['CHAT_INVALID_RNAME',	'Invalid room name'],
		'-200':	['HOOK_BAD_CALLBACK',	'Hook request with illegal callback'],
		'-201':	['HOOK_NO_CONTACT',	'Contact hook request for invalid contact id'],
		'-202':	['HOOK_NO_ROOM',	'Chatroom hook request for invalid room id'],
		'-203':	['HOOK_NOT_PARK',	'Park hook request for invalid park device'],
		'-204':	['HOOK_NO_DEVICE',	'Device hook request matched no devices'],
		'-205':	['HOOK_NO_MBOX',	'Mailbox hook request matched no mailboxes'],
		'-206':	['HOOK_NO_QUEUE',	'Queue hook request matched no queues'],
		'-207':	['HOOK_BAD_XMPP',	'Xmpp hook request has invalid xmpp id'],
		'-300':	['ADDR_CANNOT_DEL',	'Cannot remove address'],
		'-301':	['ADDR_CANNOT_ADD',	'Cannot create address'],
		'-302':	['ADDR_MISSING_NUMNAME','Cannot create. Missing name and number'],
		'-303':	['ADDR_MISSING_NUM',	'Cannot create. Missing number'],
		'-304':	['ADDR_MISSING_NAME',	'Cannot create. Missing name'],
		'-305':	['ADDR_ILLEGAL_NUM',	'Cannot create. Illegal characters in number'],
		'-306':	['ADDR_ILLEGAL_NAME',	'Cannot create. Illegal characters in name'],
		'-307':	['ADDR_CANNOT_EDIT',	'Cannot edit address'],
		'-308':	['ADDR_MISSING_XMPPNAM','Cannot create. Missing name and XMPP ID'],
		'-309':	['ADDR_MISSING_XMPP',	'Cannot create. Missing XMPP ID'],
		'-310':	['ADDR_ILLEGAL_XMPP',	'Cannot create. Illegal characters in XMPP ID'],
		'-311':	['ADDR_EDIT_NUMNAME',	'Cannot edit. Missing name and number'],
		'-312':	['ADDR_EDIT_NUM',	'Cannot edit. Missing number'],
		'-313':	['ADDR_EDIT_NAME',	'Cannot edit. Missing name'],
		'-314':	['ADDR_E_ILLEGAL_NUM',	'Cannot edit. Illegal characters in number'],
		'-315':	['ADDR_E_ILLEGAL_NAME',	'Cannot edit. Illegal characters in name'],
		'-316': ['ADDR_PHOTO_BAD',	'Bad photo data rejected'],
		'-317': ['ADDR_PHOTO_FMT',	'Bad photo format rejected'],
		'-318': ['ADDR_PHOTO_NOSUPP',	'No browser support for photo upload'],
		'-319': ['ADDR_PHOTO_PERM',	'No permission to upload photo'],
		'-400': ['XMPP_ALREADY_AUTHED',	'Cannot re-auth XMPP contact'],
		'-401': ['XMPP_ALREADY_RECV',	'Alreading receiving XMPP status'],
		'-402': ['XMPP_NOT_XMPP',	'Not an XMPP capable entry'],
		'-403': ['XMPP_NO_CONN',	'Cannot auth. No connection exists'],
		'-404':	['XMPP_NO_CONTACT',	'Not a valid presence target'],
		'-500':	['DTMF_NO_SESSION',	'No session to send DTMF'],
		'-501':	['DTMF_MANY_DIGITS',	'Too many DTMF digits'],
		'-502':	['DTMF_SEND_FAIL',	'Failed to send DTMF'],
		'-503':	['MUTE_NO_SESSION',	'No session for mute'],
		'-504':	['MUTE_INVALID_REQUEST','Invalid mute request'],
		/**
		 * Breaks down an error to it's top level type, eg. CHAT for chat errors.
		 * @param {Number} error number to grab type from
		 * @memberOf PBXError
		 */
		errtype:	function(errno) {
			if ( PBXError[errno] == null )
				return null;
			return PBXError[errno][0].split('_')[0];
		},
		/**
		 * Return the plain english version of an error code.
		 * @param {Number} error number to retrieve
		 * @memberOf PBXError
		 */
		errstr:	function(errno) {
			if ( PBXError[errno] == null )
				return null;
			return PBXError[errno][1];
		}
	};
	for ( var x in PBXError ) {
		if ( isNaN(x) )
			continue;
		PBXError[PBXError[x][0]] = x;
	}

	return {
			checkReady:		checkReady,
			startPoll:		checkReady,
			stopPoll:		stopPoll,
			getTimeDelta:		getTimeDelta,
			clearMaxData:		clearMaxData,
			loadData:		loadData,
			saveData:		saveData,
			refreshLines:		refreshLines,
			listDDIByExtension:	listDDIByExtension,
			listExtensionByDevice:	listExtensionByDevice,
			listCIDByExtension:	listCIDByExtension,
			listMACByCID:		listMACByCID,
			listExtension:		listExtension,
			getExtension:		getExtension,
			getUser:		getUser,
			getPhone:		getPhone,
			getHIDInfo:		getHIDInfo,
			getAddressbook:		getAddressbook,
			getLines:		getLines,
			getRoster:		getRoster,
			createAddress:		createAddress,
			createXmpp:		createXmpp,
			hookDevice:		hookDevice,
			hookXmpp:		hookXmpp,
			hookContact:		hookContact,
			hookRoom:		hookRoom,
			hookQueue:		hookQueue,
			unHook:			unHook,
			chatInvite:		room.requestNew,
			enableChat:		enableChat,
			disableChat:		disableChat,
			enableFeature:		enableFeature,
			disableFeature:		disableFeature,
			enableHistory:		enableHistory,
			disableHistory:		disableHistory,
			saveHistory:		saveHistory,
			setStatus:		setStatus,
			tmplErr:		tmplErr,
			Auth:			PBXAuth,
			Ops:			PBXOps,
			error:			PBXError,
			setIce:			setIce,
			/* Not really public, but needed for inter-frame browser comms. */
			parseAf:		parseAf,
			parseCh:		parseCh,
			parseHd:		parseHd,
			finishAf:		finishAf
	};
})();

IPCortex.XHR.xmlHttpRun = function (res) {
	var context = {
		/**
		 * Access method for tmpld.pl into IPCortex.PBX
		 * @private
		 */
		parseHd:
			function(p, q, r) {
				IPCortex.PBX.parseHd(p, q, r);
			},

		/**
		 * Access method for tmpld.pl into IPCortex.PBX
		 * @private
		 */
		parseAf:
			function(p) {
				IPCortex.PBX.parseAf(p);
			},

		/**
		 * Access method for tmpld.pl into IPCortex.PBX
		 * @private
		 */
		parseCh:
			function(p) {
				IPCortex.PBX.parseCh(p);
			},

		/**
		 * Access method for tmpld.pl into IPCortex.PBX
		 * @private
		 */
		finishAf:
			function(p, c) {
				IPCortex.PBX.finishAf(p, c);
			},

		/**
		 * Access method for tmpld.pl into IPCortex.PBX
		 * @private
		 */
		tmplErr:
			function(e, c) {
				IPCortex.PBX.tmplErr(e, c);
			}
	};

	var f = new Function('with(this){' + res + '}');
	f.call(context);
	f = null; res = null;
};

