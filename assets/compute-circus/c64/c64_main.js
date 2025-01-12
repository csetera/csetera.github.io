

var Module = {
	error: function(v) {
		console.log(v);
	},
	startSequence: 0,
    preRun: [ function(){Module.c64preRun();} ],
    postRun: [ function(){Module.c64postRun();} ],
	c64preRun: function() {
		FS.mkdir('/data');
		FS.mount(IDBFS, {}, '/data');
		FS.syncfs(true, function (err) {
			Module.c64FsSync();
		});		
	},
	c64postRun: function() {
		Module.startSequence|= 1;
		if( Module.startSequence == 3 ) Module.c64startup();
	},
	c64FsSync: function() {
		Module.startSequence|= 2;
		if( Module.startSequence == 3 ) Module.c64startup();
	},
	c64startup: function() {
		Module.loadFile('/assets/compute-circus/c64/c64-1984-compute-circus.prg', true);
		Module.selectJoystick(0x60, 0x1D);
	},
	canvas: document.getElementById('canvas'),
	progressElement: document.getElementById('progress'),
	statusElement: document.getElementById('status'),

	setStatus: function(text) {
	  if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
	  if (text === Module.setStatus.text) return;
	  var m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
	  var now = Date.now();
	  if (m && now - Date.now() < 30) return; // if this is a progress update, skip it if too soon
	  if (m) {
		text = m[1];
		Module.progressElement.value = parseInt(m[2])*100;
		Module.progressElement.max = parseInt(m[4])*100;
		Module.progressElement.hidden = false;
	  } else {
		Module.progressElement.value = null;
		Module.progressElement.max = null;
		Module.progressElement.hidden = true;
	  }
	  Module.statusElement.innerHTML = text;
	}, 

	totalDependencies: 0,
	monitorRunDependencies: function(left) {
	  this.totalDependencies = Math.max(this.totalDependencies, left);
	  Module.setStatus(left ? 'Preparing... (' + (this.totalDependencies-left) + '/' + this.totalDependencies + ')' : 'All downloads complete.');
	},

	loadFile: function(file, startup) {
		const components = file.split('/')
		var fileName = components[components.length - 1];

		var request;
		if (window.XMLHttpRequest) {
			request = new XMLHttpRequest();
		} else {
			request = new ActiveXObject('Microsoft.XMLHTTP');
		}
		// load
		request.open('GET', file, true);
		request.responseType = "arraybuffer";
		request.onload = function (oEvent) {
		  if (request.readyState === 4 && request.status === 200 ) {
			var arrayBuffer = request.response;
			if (arrayBuffer) {
				var byteArray = new Uint8Array(arrayBuffer);
				Module.ccall('js_LoadFile', 'number', ['string', 'array', 'number', 'number'], [fileName, byteArray, byteArray.byteLength, startup]);
			}
		  }
		};
		request.send();
	},

	setJoystick: function(key, down) {
		Module.ccall('js_setJoystick', 'number', ['number', 'number'], [key, down]);
	},
	selectJoystick: function(player1, player2) {
		Module.ccall('js_selectJoystick', 'number', ['number', 'number'], [player1, player2]);
	},
	setKey: function(key, down) {
		Module.ccall('js_setKey', 'number', ['number', 'number'], [key, down]);
	},
	setMute: function(mute) {
		return Module.ccall('js_setMute', 'number', ['number'], [mute]);
	},
	muteState: 0,
	toggleMute: function() {
		this.muteState^= 1;
		return Module.setMute(this.muteState);
	},
	requestC64FullScreen: function() {
		Module.ccall('js_requestFullscreen', 'number', ['number', 'number'], [1, 0]);
	},
	onFullScreenExit: function(softFullscreen) {
	}
};

Module.setStatus('Downloading...'); 

var arrow_keys_handler = function(e) {
    switch(e.keyCode){
        case 37: case 39: case 38:  case 40:
        case 32: case 17: case 112: case 114: case 116: case 118: e.preventDefault(); break;
        default: break;
    }
};
window.addEventListener("keydown", arrow_keys_handler, false);
window.addEventListener("keyup", arrow_keys_handler, false);

