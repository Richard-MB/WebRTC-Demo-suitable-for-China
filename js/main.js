'use strict';

var sendButton = document.getElementById("sendButton");
// var sendTextarea = document.getElementById("dataChannelSend");
// var receiveTextarea = document.getElementById("dataChannelReceive");
var sendTextarea = document.getElementById('input');
var receiveTextarea = document.getElementById('content');
var content = $('#content');

sendButton.onclick = sendText;

var isInitiator;
var isStarted;
var localStream;
var pc;
var remoteStream;
var lastText;


//////////////////////////////////////////////////////////////////////////
// var localVideo = document.getElementById("localvideo");
// var cameraLocal = document.getElementById("cameraLocal");
// var cameraRemote = document.getElementById("cameraRemote");
// var canvasObj = document.getElementById('canvas1');
// var context = canvasObj.getContext('2d');
// cameraLocal.onclick = localcamera;
// cameraRemote.onclick = remotecamera;

// function localcamera()
// {
//   context.fillStyle = '#fffff';
//   context.fillRect(0,0,320,240);
//   context.drawImage(localVideo,0,0,320,240);
// }

// function remotecamera()
// {
//   context.fillStyle = '#fffff';
//   context.fillRect(0,0,320,240);
//   context.drawImage(remoteVideo,0,0,320,240);
// }


// function gray() {
//   var ctx = context;
//   var imageData = context.getImageData(0,0,320,240);
//   var w = imageData.width,
//       h = imageData.height,
//     ret = ctx.createImageData(w, h);
//   for (var i = 0; i < w; i++) {
//     for (var j = 0; j < h; j++) {
//       var index = (i * h + j) * 4;
//       var red = imageData.data[index];
//       var green = imageData.data[index + 1];
//       var blue = imageData.data[index + 2];
//       var alpha = imageData.data[index + 3];
//       var average = (red + green + blue) / 3;
//       ret.data[index] = average;
//       ret.data[index + 1] = average;
//       ret.data[index + 2] = average;
//       ret.data[index + 3] = alpha;
//     }
//   }
//   ctx.putImageData(ret,0,0,0,0,320,240);
// }

// function createImageDataTurn() {
//   var ctx = context;
//   var w = 320,
//       h = 240;
//   var ret = ctx.createImageData(w, h);
//   var ori = context.getImageData(0, 0, 320, 240);
//   var from = 0;
//   var total = w * h * 4;
//   from = from * w * 4;
//   for (var j = 0; j < h; j++) {
//     for (var i = 0; i < w; i++) {
//       var a = (j * w + i) * 4,
//         b = from + a,
//         c = (j * w + w - i) * 4;
//       ret.data[c++] = ori.data[b++];
//       ret.data[c++] = ori.data[b++];
//       ret.data[c++] = ori.data[b++];
//       ret.data[c++] = ori.data[b++];
//     }
//   }
//   ctx.putImageData(ret, 0, 0, 0, 0, 320, 240);
// }

// function highlight() {
//   var ctx = context;
//   var imageData = context.getImageData(0,0,320,240);
//   var w = imageData.width,
//       h = imageData.height,
//       n = 50,
//     ret = ctx.createImageData(w, h);
//   var total = w * h * 4;
//   for (var i = 0; i < total; i += 4) {
//     ret.data[i] = imageData.data[i] + n;
//     ret.data[i + 1] = imageData.data[i + 1] + n;
//     ret.data[i + 2] = imageData.data[i + 2] + n;
//     ret.data[i + 3] = imageData.data[i + 3];
//   }
//   ctx.putImageData(ret,0,0,0,0,320,240);
// }

/////////////////////////////////////////////////////////////////////////

var pc_config = webrtcDetectedBrowser === 'firefox' ?
  {'iceServers':[{'url':'stun:23.21.150.121'}]} : 
  {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};

var pc_constraints = {
  'optional': [
    {'DtlsSrtpKeyAgreement': true},
    {'RtpDataChannels': true}
  ]};

var sdpConstraints = {'mandatory': {
  'OfferToReceiveAudio':true,
  'OfferToReceiveVideo':true }};

/////////////////////////////////////////////

var room;
var newRoom = document.getElementById('privateRoom');
newRoom.onclick = privateRoom; 

var fullOrNot = false;

var socket = io.connect();

function privateRoom() {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
  var string_length = 8;
  var randomstring = '';
  for (var i = 0; i < string_length; i++) {
    var rnum = Math.floor(Math.random() * chars.length);
    randomstring += chars.substring(rnum, rnum + 1);
  }

  window.location.hash = randomstring;
  location.reload();
}

room = window.location.hash.slice(1);
if (room !== '') {
  socket.emit('create or join', room);
} else {
  // console.log('This is the public room');
}

socket.on('created', function (room){
  console.log('Created room ' + room);
  // alert('Created room' + room);
});

socket.on('full', function (room){
  // console.log('Room ' + room + ' is full');
  alert('The room already has two customs.Please create a new room.');
  fullOrNot = true;
  window.opener = null;
  window.open("", "_self");
  window.close(); 
});

// socket.on('join', function (room){
//   console.log('Another peer made a request to join room ' + room);
//   console.log('This peer is the initiator of room ' + room + '!');
//   // isChannelReady = true;
// });

socket.on('joined', function (room){
  // console.log('This peer has joined room ' + room);
  alert('joined room: '+ room);
  isInitiator = true;
});

// socket.on('log', function (array){
//   console.log.apply(console, array);
// });

////////////////////////////////////////////////

function sendMessage(message){
	// console.log('Sending message: ', message);
  socket.emit('message', message, room);
}

function sendTextToServer(text, room){
  // console.log('Client send text: ',text);
  socket.emit('text', text, room);

}

socket.on('text', function (text){
    // console.log('Client Received text ',text);
    var arrHex = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "A", "B", "C", "D", "E", "F"];
    var color = "#";
    var index;
    for (var i = 0; i < 6; i++) {
      //取得0-15之间的随机整数
      index = Math.round(Math.random() * 15);
      color += arrHex[index];
    }
    console.log('Client Received text ', text);
    content.prepend('<p style="margin: 0; font-size: 12px; font-family: Microsoft YaHei; color: white; background-color: ' + color + ';"> @' + ': ' + text + '</p>');
});

socket.on('message', function (message){
  // console.log('Received message:', message);
  if (message === 'got user media') {
  	maybeStart();
  } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
      maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
  } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
  } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({sdpMLineIndex:message.label,
      candidate:message.candidate});
    pc.addIceCandidate(candidate);
  } else if (message === 'bye' && isStarted) {
    handleRemoteHangup();
  }
});

////////////////////////////////////////////////////

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

function handleUserMedia(stream) {
  localStream = stream;
  attachMediaStream(localVideo, stream);
  sendMessage('got user media');
  if (isInitiator) {
    maybeStart();
  }
}

function handleUserMediaError(error){
  alert('navigator.getUserMedia error: ', error);
}

var constraints = {video: true, audio: true};

navigator.getUserMedia(constraints, handleUserMedia, handleUserMediaError);
console.log('Getting user media with constraints', constraints);

function maybeStart() {
  if (!isStarted && localStream) {
    createPeerConnection();
    pc.addStream(localStream);
    isStarted = true;
    if (isInitiator) {
      doCall();
    }
  }
}

window.onbeforeunload = function(e){
	if(!fullOrNot){
     sendMessage('bye');
  }
}

/////////////////////////////////////////////////////////

function createPeerConnection() {
  try {
    pc = new RTCPeerConnection(pc_config, pc_constraints);
    pc.onicecandidate = handleIceCandidate;
    // console.log('Created RTCPeerConnnection with:\n' +
    //   '  config: \'' + JSON.stringify(pc_config) + '\';\n' +
    //   '  constraints: \'' + JSON.stringify(pc_constraints) + '\'.');
  } catch (e) {
    // console.log('Failed to create PeerConnection, exception: ' + e.message);
    alert('Cannot create RTCPeerConnection object.');
      return;
  }
  pc.onaddstream = handleRemoteStreamAdded;
  pc.onremovestream = handleRemoteStreamRemoved;
}

/////////////////////////////////////////////////////////////////////////
function sendText(){
  lastText = sendTextarea.value;
  sendTextarea.value = '';
  sendTextToServer(lastText, room);
}
////////////////////////////////////////////////////////////////////////////

function handleIceCandidate(event) {
  // console.log('handleIceCandidate event: ', event);
  if (event.candidate) {
    sendMessage({
      type: 'candidate',
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate.candidate});
  } else {
    // console.log('End of candidates.');
  }
}

function handleRemoteStreamAdded(event) {
  // console.log('Remote stream added.');
  attachMediaStream(remoteVideo, event.stream);
  remoteStream = event.stream;
}

function doCall() {
  var constraints = {'optional': [], 'mandatory': {'MozDontOfferDataChannel': true}};
  if (webrtcDetectedBrowser === 'chrome') {
    for (var prop in constraints.mandatory) {
      if (prop.indexOf('Moz') !== -1) {
        delete constraints.mandatory[prop];
      }
     }
   }
  constraints = mergeConstraints(constraints, sdpConstraints);
  // console.log('Sending offer to peer, with constraints: \n' +
  //   '  \'' + JSON.stringify(constraints) + '\'.');
  pc.createOffer(setLocalAndSendMessage, null, constraints);
}

function doAnswer() {
  // console.log('Sending answer to peer.');
  pc.createAnswer(setLocalAndSendMessage, null, sdpConstraints);
}

function mergeConstraints(cons1, cons2) {
  var merged = cons1;
  for (var name in cons2.mandatory) {
    merged.mandatory[name] = cons2.mandatory[name];
  }
  merged.optional.concat(cons2.optional);
  return merged;
}

function setLocalAndSendMessage(sessionDescription) {
  // Set Opus as the preferred codec in SDP if Opus is present.
  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
  pc.setLocalDescription(sessionDescription);
  sendMessage(sessionDescription);
}

function handleRemoteStreamAdded(event) {
  // console.log('Remote stream added.');
  attachMediaStream(remoteVideo, event.stream);
  remoteStream = event.stream;
}
function handleRemoteStreamRemoved(event) {
  // alert('Remote stream removed. Event: ', event);
}

function hangup() {
  // console.log('Hanging up.');
  stop();
  sendMessage('bye');
}

function handleRemoteHangup() {
  // console.log('Session terminated.');
  stop();
  isInitiator = false;
}

function stop() {
  isStarted = false;
  pc.close();
  pc = null;
}

///////////////////////////////////////////

// Set Opus as the default audio codec if it's present.
function preferOpus(sdp) {
  var sdpLines = sdp.split('\r\n');
  var mLineIndex;
  // Search for m line.
  for (var i = 0; i < sdpLines.length; i++) {
      if (sdpLines[i].search('m=audio') !== -1) {
        mLineIndex = i;
        break;
      }
  }
  if (mLineIndex === null) {
    return sdp;
  }

  // If Opus is available, set it as the default in m line.
  for (i = 0; i < sdpLines.length; i++) {
    if (sdpLines[i].search('opus/48000') !== -1) {
      var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
      if (opusPayload) {
        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
      }
      break;
    }
  }

  // Remove CN in m line and sdp.
  sdpLines = removeCN(sdpLines, mLineIndex);

  sdp = sdpLines.join('\r\n');
  return sdp;
}

function extractSdp(sdpLine, pattern) {
  var result = sdpLine.match(pattern);
  return result && result.length === 2 ? result[1] : null;
}

// Set the selected codec to the first in m line.
function setDefaultCodec(mLine, payload) {
  var elements = mLine.split(' ');
  var newLine = [];
  var index = 0;
  for (var i = 0; i < elements.length; i++) {
    if (index === 3) { // Format of media starts from the fourth.
      newLine[index++] = payload; // Put target payload to the first.
    }
    if (elements[i] !== payload) {
      newLine[index++] = elements[i];
    }
  }
  return newLine.join(' ');
}

// Strip CN from sdp before CN constraints is ready.
function removeCN(sdpLines, mLineIndex) {
  var mLineElements = sdpLines[mLineIndex].split(' ');
  // Scan from end for the convenience of removing an item.
  for (var i = sdpLines.length-1; i >= 0; i--) {
    var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
    if (payload) {
      var cnPos = mLineElements.indexOf(payload);
      if (cnPos !== -1) {
        // Remove CN payload from m line.
        mLineElements.splice(cnPos, 1);
      }
      // Remove CN line in sdp
      sdpLines.splice(i, 1);
    }
  }
  sdpLines[mLineIndex] = mLineElements.join(' ');
  return sdpLines;
}