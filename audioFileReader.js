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
var theData = [ [] ];
var midiFile;
var timeSignature =[];

var csvA =[];
var csvB =[];
var csvMidi =[];

var sourceDir = "sourceFiles/";
var fileextension = ".mp3";
var fileList = [];


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

	var canvas = document.getElementById("progressCanvas");
	canvas.addEventListener("mousedown", doMouseDown, false);
	
	theData[0][1] = getCsv(sourceDir+'beatIndex.csv');
	//getCsv('csvA.csv',1);
	//getCsv('csvB.csv',2);


	getMidi(sourceDir+"(midi).mid");
	//getMidi("(midi).mid");


	currentFileIndex = 1;


	$.ajax({
    url: sourceDir,
    success: function (data) {
        //List all .png file names in the page
        var totalNumberOfRecords = 0;
        var index =1;
        $(data).find("a:contains(" + fileextension + ")").each(function () {
            totalNumberOfRecords++;
            theData[totalNumberOfRecords]= [[],[] ];
            var fileName = this.href.split("/");
            var artistName = unescape(fileName[fileName.length-1].split(".")[0])

            fileList.push(artistName);

            getAudio(sourceDir+artistName+".mp3",index, artistName)
            index++;
        });
    },
    error: function(data){
    	console.log("errorrr");

    }
	});

	audioContext = new contextClass();

}

window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
})();



function audioFileDecoded(audioBuffer){

	var i = 1;

	while (theData[i][0].length){
		i++;
	}

	theData[i][0] = audioBuffer;
	theData[i][1] = getCsv(sourceDir+fileList[i-1]+".csv");
	
	if(i==1) {
		//playSound(audioBuffer);
		drawProgress(document.getElementById("progressCanvas"));
	}
	
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
	drawProgress(document.getElementById("progressCanvas"));
}

function pause() {
	sourceNode.stop();
	// Measure how much time passed since the last pause.
	if (playingOn) startOffset += audioContext.currentTime - startTime;
	playingOn = false;
}

function stop() {
	sourceNode.stop();
	startOffset = 0;
	playingOn = false;
}

function switchAudio(targetIndex){
	if(playingOn) sourceNode.stop();
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

	canvas_x = x/canvasWidth * theData[currentFileIndex][0].length / theData[currentFileIndex][0].sampleRate;
	stop();
	startOffset = canvas_x;
	playSound(theData[currentFileIndex][0]);

}


//calculate volume using simple linear array


function drawProgress(canvas){
	var progress = canvas.getContext("2d");
	var gradient = progress.createLinearGradient(0, 0, 170, 0);
	gradient.addColorStop(0, "white");
	gradient.addColorStop(1, "orange");

	var currentProgressInX = startOffset * canvasWidth /theData[currentFileIndex][0].length * theData[currentFileIndex][0].sampleRate;
	progress.clearRect(0, 0, canvas.width, canvas.height);

	progress.beginPath();
	progress.rect(0,0,currentProgressInX,canvas.height)
	progress.fillStyle = gradient;
	progress.fill();

    progress.stroke();    
    
    if (playingOn){
    	startOffset += audioContext.currentTime - startTime;
    	startTime = audioContext.currentTime;

    	var measureNumber = time2Measure(startOffset, theData[currentFileIndex][1], theData[0][1]);
    	var xmlid = parseMeasure(xmlDoc, measureNumber);
    	if (page != vrvToolkit.getPageWithElement(xmlid)){
	        page = vrvToolkit.getPageWithElement(xmlid);
	        load_page();    		
    	}

        highlightingMeausre(xmlid);
    }
    
    
    
	requestAnimFrame(function() {
		drawProgress(document.getElementById("progressCanvas"))
	});
}


function indexInterpolation(currentSecond, csvArray, csvArraySwitch){
	var i = 0;

	while(currentSecond > csvArray[i]){
		i++;
	}

	var interpolation = (currentSecond - csvArray[i-1]) / (csvArray[i] - csvArray[i-1]);
	return csvArraySwitch[i-1] + interpolation * (csvArraySwitch[i] - csvArraySwitch[i-1])


}


function time2Measure(currentSecond, csvAudio, csvBeat){
	var i = csvAudio.binaryIndexOf(currentSecond);

	//var i = 0;

	// while(currentSecond > csvAudio[i]){
	// 	if (i+1<csvAudio.length){
	// 		i++;
	// 	} else {
	// 		i = csvAudio.length - 1
	// 		break;
	// 	}
	// }

	var beat = csvBeat[i]
	var timeSigZone = 0; 
	if (timeSignature.length != 1){
		while(beat > timeSignature[timeSigZone+1][1] / 480){ 
			timeSigZone++;
			if (timeSigZone + 1 == timeSignature.length) break;
		}
	}

	var formerMeasure = 0;
	if (timeSigZone != 0){
		for(var j = 0; j<timeSigZone; j++){
			var beatInMeasure = 480 * timeSignature[j][0].param1 / Math.pow(2, timeSignature[j][0].param2 -2 );
			formerMeasure = formerMeasure + Math.floor( (timeSignature[j+1][1] - timeSignature[j][1]) / beatInMeasure);
		}
	}


	var beatInMeasure = timeSignature[timeSigZone][0].param1 / Math.pow(2, timeSignature[timeSigZone][0].param2 -2 );

	var targetMeasure = formerMeasure + Math.floor ( (beat - timeSignature[timeSigZone][1] / 480) / beatInMeasure) +1 ;
	//var targetMeasure = Math.floor(csvBeat[i][0]/4) + 1;

	return targetMeasure
}

function measure2Time(currentMeasure, csvAudio, csvBeat){
	var i = 0;

	var timeSigZone = 0; 
	if (timeSignature.length != 1){
		while(currentMeasure > timeSignature[timeSigZone+1][2]){ 
			timeSigZone++;
			if (timeSigZone + 1 == timeSignature.length) break;
		}
	}

	var formerBeat = 0;
	var formerMeasure = 0;
	if (timeSigZone != 0){
		formerBeat = timeSignature[timeSigZone][1];
		for(var j = 0; j<timeSigZone; j++){
			var beatInMeasure = 480 * timeSignature[j][0].param1 / Math.pow(2, timeSignature[j][0].param2 -2 );
			formerMeasure = formerMeasure + (timeSignature[j+1][1] - timeSignature[j][1]) / beatInMeasure;
		}
	}


	var beatInMeasure = timeSignature[timeSigZone][0].param1 / Math.pow(2, timeSignature[timeSigZone][0].param2 -2 );


	var index = csvBeat.binaryIndexOf( (currentMeasure - formerMeasure -1 ) * beatInMeasure );

	// (csvBeat[i] - formerBeat) / ;




	var targetSecond = csvAudio[index];
	console.log(currentMeasure);

	return targetSecond
}


function move2Measure(targetMeasure, csvAudio, csvBeat){
	pause();
	startOffset = measure2Time(targetMeasure, csvAudio, csvBeat);
	playSound(theData[currentFileIndex][0]);

}


function getAudio(url, index, artistName)
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
		context.decodeAudioData(xmlhttp.response, function(audioBuffer){
			theData[index][0] = audioBuffer;
			theData[index][1] = getCsv(sourceDir+fileList[index-1]+".csv");
			var surName = artistName.split(",")[0]
			if (index==1 ){
				var button='<button class="btn btn-primary" id="'+unescape(artistName)+'" >'+surName+'</button>' 
			} else{
				var button='<button class="btn btn-default" id="'+unescape(artistName)+'" >'+surName+'</button>'
			}
            $("#audioFile-buttons").append(button);
		}, audioFileDecodeFailed)
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

		var midEvents = midiFile.getTrackEvents(0);
		var j=0;
		var absoluteTime = 0;
		var timeSigMeasure = 0;
		for (var i=0, len=midEvents.length; i<len; i++){
			absoluteTime = absoluteTime + midEvents[i].delta;
			if(midEvents[i].subtype == 88) {
				if(j>0){
					timeSigMeasure = timeSignature[j-1][2] + (absoluteTime - timeSignature[j-1][1]) / ( 480 * timeSignature[j-1][0].param1 / Math.pow(2, timeSignature[j-1][0].param2 -2 ))
				}
				timeSignature[j] = [midEvents[i], absoluteTime, timeSigMeasure];
				j++;
			}
		}





    }

    xmlhttp.open("GET",url,true);
    xmlhttp.send();
}


function getCsv(url){
	var resultArray = [];

	Papa.parse(url, {
		download: true,
		dynamicTyping: true,
		complete: function(results) {
			// theData[fileIndex]=[ [], [] ];
			for (var i=0, len=results.data.length; i<len-1; i++){
				resultArray[i] = results.data[i][0];
			}
		}
	});

	return resultArray;
}


function binaryIndexOf(searchElement) {
    'use strict';
 
    var minIndex = 0;
    var maxIndex = this.length - 1;
    var currentIndex;
    var currentElement;
    var diff;
    var minimumDiff;

    if (searchElement < this[minIndex]){
    	return 0;
    }
 
    while (minIndex < maxIndex) {
        currentIndex = (minIndex + maxIndex) / 2 | 0;
        currentElement = this[currentIndex];
        //console.log([currentElement, minIndex, maxIndex])
 
        if (currentElement < searchElement  ) {
            minIndex = currentIndex + 1;
            if (minIndex == maxIndex && this[maxIndex]>searchElement) return currentIndex;
        }
        else if (currentElement > searchElement) {
            maxIndex = currentIndex - 1;
        }
        else {
            return currentIndex;
        }
    }

    return minIndex;
}
Array.prototype.binaryIndexOf = binaryIndexOf;
