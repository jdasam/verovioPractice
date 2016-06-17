var audioContext;
var sourceNode;
var startOffset = 0;
var startTime = 0;
var audioFile;
var playingOn=false;
var playingB=false;
var increaseValueSave;
var userRecord = [];
var currentFileIndex = 1;
var theData = [ [],[],[],[],[],[]  ];
var midiFile;

var csvA =[];
var csvB =[];
var csvMidi =[];



var contextClass = (window.AudioContext || 
  window.webkitAudioContext || 
  window.mozAudioContext || 
  window.oAudioContext || 
  window.msAudioContext);
if (contextClass) {
  // Web Audio API is available.
  var context = new contextClass();
} else {
  // Web Audio API is not available. Ask the user to use a supported browser.
  // Does this work?
  alert('The Web browser does not support WebAudio. Please use the latest version.');
}



window.onload=function(){

	var canvas = document.getElementById("interfaceCanvas");
	canvas.addEventListener("mousedown", doMouseDown, false);
	
	Papa.parse('csvMidi.csv', {
		download: true,
		dynamicTyping: true,
		complete: function(results) {
			theData[0] = results.data;
		}
	});

	Papa.parse('csvA.csv', {
		download: true,
		dynamicTyping: true,
		complete: function(results) {
			theData[1][1] = results.data;
			//console.log(csvA[0][0]);

		}
	});
	
	Papa.parse('csvB.csv', {
		download: true,
		dynamicTyping: true,
		complete: function(results) {
			theData[2][1] = results.data;
		}
	});


	getAudio("audioA.mp3");
	getAudio("audioB.mp3");

	getMidi("pathetique_3.mid");

	currentFileIndex = 1;





	audioContext = new contextClass();

}

window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
})();





function fileLoaded(e){
	audioContext.decodeAudioData(e.target.result, audioFileDecoded, audioFileDecodeFailed);
}

function fileLoadedB(e){
	audioContext.decodeAudioData(e.target.result, audioFileDecodedB, audioFileDecodeFailed);
}

function csvFileLoadedA(e){
	Papa.parse(e.target.result);
	console.log('midi file loaded?');
}



function audioFileDecoded(audioBuffer){

	var i = 1;

	while (typeof(theData[i][0])=='object'){
		i++;
		console.log(i)
	}

	theData[i][0] = audioBuffer;
	
	if(i==1) {
		playSound(audioBuffer);
		drawProgress(document.getElementById("interfaceCanvas"));
	}
	
}
function audioFileDecodedB(audioBuffer){

	audioFileB = audioBuffer;
}


function audioFileDecodeFailed(e){
	alert("The audio file cannot be decoded!");
}



function loadSound(url) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	// When loaded decode the data
	request.onload = function() {

		// decode the data
		context.decodeAudioData(request.response, audioFileDecoded, audioFileDecodeFailed);
	}
	request.send();
}




function setupAudioNodes() {
	// create a buffer source node
	sourceNode = audioContext.createBufferSource();
	// and connect to destination
	sourceNode.connect(audioContext.destination);
	
}


//audio file playback control

function playSound(audioBuffer) {
	setupAudioNodes(); //이거 사실 한번만 호출해 두면 될 것 같은데...
	startTime = audioContext.currentTime;
	sourceNode.buffer = audioBuffer;
	sourceNode.start(0, startOffset % audioBuffer.duration);
	playingOn = true;
}

function pause() {
	sourceNode.stop();
	// Measure how much time passed since the last pause.
	startOffset += audioContext.currentTime - startTime;
	playingOn = false;
}

function stop() {
	sourceNode.stop();
	startOffset = 0;
	playingOn = false;
}

function switchAudio(targetIndex){
	sourceNode.stop();
	setupAudioNodes();
	startTime = audioContext.currentTime;

	sourceNode.buffer = theData[targetIndex][0];
	startOffset = indexInterpolation(startOffset, theData[currentFileIndex][1], theData[targetIndex][1])
	sourceNode.start(0, startOffset % theData[targetIndex][0].duration);
	playingOn = true;

	currentFileIndex = targetIndex;
}


function doMouseDown(e){
	//var currentTime = remainingSeconds;
	var rect = e.target.getBoundingClientRect();
	var x= e.clientX-rect.left - e.target.clientLeft + e.target.scrollLeft;

	canvas_x = x/plottingCanvasWidth * theData[currentFileIndex][0].length / theData[currentFileIndex][0].sampleRate;
	stop();
	startOffset = canvas_x;
	playSound(theData[currentFileIndex][0]);

}


//calculate volume using simple linear array


function drawProgress(canvas){
	var progress = canvas.getContext("2d");
	
	progress.clearRect(0, 0, canvas.width, canvas.height);
	progress.strokeStyle = "#000000"

	progress.beginPath();

	progress.moveTo(startOffset * plottingCanvasWidth /theData[currentFileIndex][0].length * theData[currentFileIndex][0].sampleRate, 0);
    progress.lineTo(startOffset * plottingCanvasWidth /theData[currentFileIndex][0].length * theData[currentFileIndex][0].sampleRate, canvas.height);

    progress.lineWidth=1;

    progress.stroke();    
    
    if (playingOn){
    	startOffset += audioContext.currentTime - startTime;
    	startTime = audioContext.currentTime;

    	var measureNumber = time2Measure(startOffset, theData[currentFileIndex][1], theData[0]);

    	var xmlid = parseMeasure(xmlDoc, measureNumber);
        page = vrvToolkit.getPageWithElement(xmlid);

        load_page();
        highlightingMeausre(xmlid);
    }
    
    
    
	requestAnimFrame(function() {
		drawProgress(document.getElementById("interfaceCanvas"))
	});
}


function indexInterpolation(currentSecond, csvArray, csvArraySwitch){
	var i = 0;

	while(currentSecond > csvArray[i][0]){
		i++;
	}

	var interpolation = (currentSecond - csvArray[i-1][0]) / (csvArray[i][0] - csvArray[i-1][0]);
	return csvArraySwitch[i-1][0] + interpolation * (csvArraySwitch[i][0] - csvArraySwitch[i-1][0])


}


function time2Measure(currentSecond, csvAudio, csvBeat){
	var i = 0;

	while(currentSecond > csvAudio[i][0]){
		i++;
	}

	var targetMeasure = Math.floor(csvBeat[i][0]/4) + 1;

	return targetMeasure
}

function measure2Time(currentMeasure, csvAudio, csvBeat){
	var i = 0;


	while( (currentMeasure-1) * 4 > csvBeat[i][0]){
		i++;
	}

	var targetSecond = csvAudio[i][0];

	return targetSecond
}


function move2Measure(targetMeasure, csvAudio, csvBeat){
	pause();
	startOffset = measure2Time(targetMeasure, csvAudio, csvBeat);
	playSound(theData[currentFileIndex][0]);

}


function getAudio(url)
{
    var xmlhttp

    if (window.ActiveXObject)
    {
     xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    else if (window.XMLHttpRequest)
    {
     xmlhttp = new XMLHttpRequest();
    } 
    xmlhttp.responseType = "arraybuffer";
    xmlhttp.onload = function()
    {
		context.decodeAudioData(xmlhttp.response, audioFileDecoded, audioFileDecodeFailed)
    }

    xmlhttp.open("GET",url,true);
    xmlhttp.send();
}


function getMidi(url)
{
    var xmlhttp

    if (window.ActiveXObject)
    {
     xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    else if (window.XMLHttpRequest)
    {
     xmlhttp = new XMLHttpRequest();
    } 
    xmlhttp.responseType = "arraybuffer";
    xmlhttp.onload = function()
    {
		midiFile = new MIDIFile(xmlhttp.response);
    }

    xmlhttp.open("GET",url,true);
    xmlhttp.send();
}

