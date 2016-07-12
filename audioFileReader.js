var audioContext;
var sourceNode;
var startOffset = 0;
var startTime = 0;
var audioFile;
var playingOn=false;
var currentFileIndex = 1;
var theData = [ [] ];
var midiFile;

var timeSignature =[];
var rptStructure =[];

var csvA =[];
var csvB =[];
var csvMidi =[];

var sourceDir = "sourceFiles/";
var fileextension = ".csv";
var fileList = [];

var composerArray = [];
var pieceList = []; 
// var pieceAddress =[];



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

	var items = [];
	
	$.getJSON( "data.json", function( data ) {
	  items.push(data);
	  folder2Composer(items[0]);
	});


	var canvas = document.getElementById("progressCanvas");
	canvas.addEventListener("mousedown", doMouseDown, false);
	
	loadFiles(sourceDir);

	audioContext = new contextClass();

}

window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
})();

function loadFiles(urlAddress){

    $.get( urlAddress+"score.mei", function( data ) {
      vrvToolkit.loadData(data);

      //var svg = vrvToolkit.renderData( data + "\n", "" );
      load_page();

      xmlDoc = $.parseXML(data);

      //for (var rptMeasure, len = repeatInfo.length;)

	  getMidi(urlAddress+"(midi).mid");



      console.log("mei loaded");

    }, 'text');
		    


	theData = [ [] ];
	fileList = [];

	theData[0][1] = getCsv(urlAddress+'beatIndex.csv');



	currentFileIndex = 1;


	$.ajax({
    url: urlAddress,
    success: function (data) {
        //List all .png file names in the page
        var totalNumberOfRecords = 0;
        var index =1;
        $(data).find("a:contains(" + fileextension + ")").each(function () {
			var fileName = this.href.split("/");
            var artistName = unescape(fileName[fileName.length-1].split(".")[0])

            if(artistName!="beatIndex") {
      			totalNumberOfRecords++;
            	theData[totalNumberOfRecords]= [[],[] ];  
	            fileList.push(artistName);
	            getAudio(urlAddress,index, artistName) 	;
	            index++;
            }
        });
    },
    error: function(data){
    	console.log("error in loading mp3 files");

    }
	});
}



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
	if (startOffset) startOffset = indexInterpolation(startOffset, theData[currentFileIndex][1], theData[targetIndex][1]);
	if (isNaN(startOffset)) startOffset = 0;

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
	var i = csvArray.binaryIndexOf(currentSecond);


	var interpolation = (currentSecond - csvArray[i]) / (csvArray[i+1] - csvArray[i]);
	return csvArraySwitch[i] + interpolation * (csvArraySwitch[i+1] - csvArraySwitch[i])


}


function time2Measure(currentSecond, csvAudio, csvBeat){
	var i = csvAudio.binaryIndexOf(currentSecond);
	var beat = csvBeat[i]

	var targetMeasure = measureBeat.binaryIndexOf(beat);
	targetMeasure = rptStructure[targetMeasure];



	return targetMeasure
}

function time2orderedMeasure(currentSecond, csvAudio, csvBeat){
	var i = csvAudio.binaryIndexOf(currentSecond);
	var beat = csvBeat[i]

	var targetMeasure = measureBeat.binaryIndexOf(beat);

	return targetMeasure

}

function measure2Time(currentMeasure, csvAudio, csvBeat){
	var i = 0;

	// find nearest playing position that play selectedmeasure
	var candidates = new Array();
	var pos = rptStructure.indexOf(currentMeasure*1);

	while(pos > -1){
	    candidates.push(pos);
	    pos = rptStructure.indexOf(currentMeasure*1, pos + 1);
	}

	if (candidates.length > 1){
		var playingMeasure = time2orderedMeasure(startOffset, theData[currentFileIndex][1], theData[0][1]);
		var indexFloor = candidates.binaryIndexOf(playingMeasure);

		if(indexFloor != candidates.length-1){
			var floorDif = playingMeasure - candidates[indexFloor];
			var ceilDif = candidates[indexFloor+1] - playingMeasure;

			if (floorDif > ceilDif) indexFloor = indexFloor + 1;
		}
	}

	var currentMeasureInOrder = candidates[indexFloor];
	//var currentMeasureInOrder = rptStructure.indexOf(currentMeasure*1);
	var targetBeat = measureBeat[currentMeasureInOrder];
	var index = csvBeat.binaryIndexOf( targetBeat );

	// (csvBeat[i] - formerBeat) / ;



	if (csvBeat[index+1] - csvBeat[index] != 0){
		var interpolation = (targetBeat - csvBeat[index]) / (csvBeat[index+1] - csvBeat[index]);
	} else var interpolation = 0;
	var targetSecond = csvAudio[index] + interpolation * (csvAudio[index+1] - csvAudio[index])
	console.log(currentMeasure);


	return targetSecond
}


function move2Measure(targetMeasure, csvAudio, csvBeat){
	if(playingOn)pause();
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
			theData[index][1] = getCsv(url+fileList[index-1]+".csv");
			var surName = artistName.split(",")[0]
			if (index==1 ){
				var button='<button class="btn btn-primary" id="'+unescape(artistName)+'" >'+surName+'</button>' 
			} else{
				var button='<button class="btn btn-default" id="'+unescape(artistName)+'" >'+surName+'</button>'
			}
            $("#audioFile-buttons").append(button);
		}, audioFileDecodeFailed)
    }

    xmlhttp.open("GET",url+artistName+".mp3",true);
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
		console.log("get midi work");

		var midEvents = midiFile.getTrackEvents(0);
		var j=0;
		var absoluteTime = 0;
		var timeSigMeasure = 0;
		for (var i=0, len=midEvents.length; i<len; i++){
			console.log
			absoluteTime = absoluteTime + midEvents[i].delta;
			if(midEvents[i].subtype == 88) {
				if(j>0){
					timeSigMeasure = timeSignature[j-1][2] + (absoluteTime - timeSignature[j-1][1]) / ( 480 * timeSignature[j-1][0].param1 / Math.pow(2, timeSignature[j-1][0].param2 -2 ))
				}
				timeSignature[j] = [midEvents[i], absoluteTime, timeSigMeasure];
				j++;
			}
		}

		var rptInfo = searchRepeatInformation();
	  	rptStructure = makeRepeatInfoInMeasure(rptInfo);
	  	measureBeat = makeMeasureInfoInBeat(rptStructure);






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
			for (var i=0, len=results.data[0].length; i<len-1; i++){
				resultArray[i] = results.data[0][i];
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
            if (this[currentIndex+1]>searchElement) return currentIndex;
            else minIndex = currentIndex+1;
            if (minIndex == maxIndex && this[maxIndex]>searchElement) return currentIndex;
        }
        else if (currentElement > searchElement) {
            maxIndex = currentIndex - 1;
        }
        else {
            while(this[currentIndex+1]==searchElement) currentIndex++
            return currentIndex;
        }
    }

    return Math.min(minIndex, maxIndex);
}
Array.prototype.binaryIndexOf = binaryIndexOf;




function folder2Composer(dataArray){
	for (var i = 0, len = dataArray.length, k=0; i< len; i++){
	    if (composerArray.indexOf(dataArray[i].name) == -1){
	      composerArray.push(dataArray[i].name.split(' ')[0])
	      pieceList[k] = [];
	      // pieceAddress[k] = [];
	      k++;
	  	}
  	}
	composerArray.sort();

	for (var l = 0, clen = composerArray.length; l<clen; l++) {
		$('#composerUl').append('<li><a onclick=composerSelect("'+composerArray[l]+'")>'+composerArray[l]+'</a></li>')
	}

	for (var j = 0, len = dataArray.length; j< len; j++){
    	var composerIndex = composerArray.indexOf(dataArray[j].name.split(' ')[0])
    	var tempPieceName = getNameByDepth(dataArray[j]);
    	// var tempAddress = getAddressByDepth(dataArray[j]);
    	tempPieceName.forEach(function (d){
    		pieceList[composerIndex].push(d);
    	})
    	// tempAddress.forEach(function (e){
    	// 	pieceAddress[composerIndex].push(e);
    	// })
  	}
}

function composerSelect(name){
	$("#dropButtonComposer").text(name);
	var composerIndex = composerArray.indexOf(name);

	$('#pieceUl').empty()

	for (var i=0, len = pieceList[composerIndex].length; i<len; i++){
		var tempPieceName = pieceList[composerIndex][i].replace(name, '');
		$('#pieceUl').append('<li><a onclick=pieceSelect(['+composerIndex+','+i+'])>	'+tempPieceName+'</a></li>');
	}

}

function pieceSelect(address){

	var url = "sourceFiles/".concat(pieceList[address[0]][address[1]].replaceAll(" - ", "/")).concat("/");

	if (confirm("Load this piece?") == true) {

		$("#audioFile-buttons").empty();
		loadFiles(url);
	} else return

}


function getDepth (obj) {
  var depth = 0;
  if (obj.children) {
      obj.children.forEach(function (d) {
          var tmpDepth = getDepth(d)
          if (tmpDepth > depth) {
              depth = tmpDepth
          }
      })
  }
  return 1 + depth
}

function getNameByDepth (obj){
  var pieceName = obj.name;
  var nameList = [];

  //var address = obj.name;

  if (obj.children){
    obj.children.forEach(function(d) {
      var tempPieceName = getNameByDepth(d);
      tempPieceName.forEach(function(e){
        nameList.push(pieceName.concat(" - ").concat(e));
      })
      //address = address.concat("/").concat(d.name);
    })
  }

  if(nameList == 0) nameList.push(pieceName);

  return nameList
}

function getAddressByDepth (obj){
  var pieceName = obj.name;
  var nameList = [];

  //var address = obj.name;

  if (obj.children){
    obj.children.forEach(function(d) {
      var tempPieceName = getAddressByDepth(d);
      tempPieceName.forEach(function(e){
        nameList.push(pieceName.concat("/").concat(e));
      })
      //address = address.concat("/").concat(d.name);
    })
  }

  if(nameList == 0) nameList.push(pieceName);

  return nameList
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

function makeRepeatInfoInMeasure (repeatInfo){


	var measureActualOrder = [0]
	var measureNumber = 1;
	for(var i = 0, len = repeatInfo[0].length; i<len; i++ ){
		while (measureNumber <= repeatInfo[0][i]){
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}
		measureNumber = repeatInfo[1][i];
		var repeatEnd = repeatInfo[0][i];


		//find whether there is alternative ending
		for(var j =0, lenB = repeatInfo[2].length; j<lenB; j++){
			if(repeatInfo[2][j] > repeatInfo[1][i] && repeatInfo[2][j] <= repeatInfo[0][i] ) {
				repeatEnd = repeatInfo[2][j] -1;

			}
		}

		while (measureNumber <= repeatEnd ){
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}

		if (measureNumber != repeatInfo[0][i]+1){
			measureNumber = repeatInfo[0][i]+1;
		}

	}

	if (!repeatInfo.coda){

		while (measureNumber <= repeatInfo[3]){
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}
	} else {
		var semiEnding = (repeatInfo.dacapo || repeatInfo.dalsegno);

		while (measureNumber <= semiEnding){
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}
	}

	//if dacapo, go back to the first measure and go until fine
	if(repeatInfo.dacapo){
		measureNumber = 1;
		var ending;
		if (repeatInfo.fine){
			ending = repeatInfo.fine;
		}else if (repeatInfo.alcoda){
			ending = repeatInfo.alcoda;
		}else ending = repeatInfo[3];
		
		while (measureNumber <= ending ){ 
			measureActualOrder.push(measureNumber);
			measureNumber++;

			if(repeatInfo[2].indexOf(measureNumber) != -1){
				measureNumber = repeatInfo[4][repeatInfo[2].indexOf(measureNumber)];
			}
		}
	}else if(repeatInfo.dalsegno){
		measureNumber = repeatInfo.segno;
		var ending;
		if (repeatInfo.fine){
			ending = repeatInfo.fine;
		}else if (repeatInfo.alcoda){
			ending = repeatInfo.alcoda;
		}else ending = repeatInfo[3];

		while (measureNumber <= ending ){ 
			measureActualOrder.push(measureNumber);
			measureNumber++;

			if(repeatInfo[2].indexOf(measureNumber) != -1){
				measureNumber = repeatInfo[4][repeatInfo[2].indexOf(measureNumber)];
			}
		}
	}

	if(repeatInfo.alcoda){
		measureNumber = repeatInfo.coda;

		while (measureNumber <= repeatInfo[3] ){ 
			measureActualOrder.push(measureNumber);
			measureNumber++;
		}
	}


	return measureActualOrder;
}

function makeMeasureInfoInBeat(measureInfo){

	var measureBeat = [0];

	for(var i=1, len= measureInfo.length; i<len; i++ ){
		var timeSigZone = 0; 
		if (timeSignature.length != 1){
			while(i > timeSignature[timeSigZone+1][2]){ 
				timeSigZone++;
				if (timeSigZone + 1 == timeSignature.length) break;
			}
		}

		var beatInMeasure = timeSignature[timeSigZone][0].param1 / Math.pow(2, timeSignature[timeSigZone][0].param2 -2 );

		measureBeat.push(measureBeat[i-1]+beatInMeasure);
	}

	measureBeat.unshift(0);

	return measureBeat;
}


function searchRepeatInformation(){
	var repeatInfo = [[], [], [], [], []]; // 0.repeatEnd 1.repeatStart 2.alt ending start measure 3.ending measure number
	//4. alt ending second start measure 

	var rptEnd = $(xmlDoc).find('measure[right="rptend"]');
	var rptStart = $(xmlDoc).find('measure[left="rptstart"]');
	var altEnding =  $(xmlDoc).find('ending[n="1"]').find('measure');
	var altEnding2nd =  $(xmlDoc).find('ending[n="2"]').find('measure');

	var measureList = $(xmlDoc).find('measure');
	var ending = measureList[measureList.length-1].getAttribute('n');

	var dacapo = $(xmlDoc).find('measure[repeat="dacapo"]');
	var fine = $(xmlDoc).find('measure[repeat="fine"]');

	var alcoda = $(xmlDoc).find('measure[repeat="alcoda"]');
	var coda = $(xmlDoc).find('measure[repeat="coda"]');


	var dalsegno = $(xmlDoc).find('measure[repeat="dalsegno"]');
	var segno = $(xmlDoc).find('measure[repeat="segno"]');


	for(var i=0, len = rptEnd.length; i<len; i++){
	  	repeatInfo[0].push(rptEnd[i].getAttribute('n') * 1);
	}
	for(var j=0, lenB = rptStart.length; j<lenB; j++){
	  	repeatInfo[1].push(rptStart[j].getAttribute('n') *1);
	}
	for(var k=0, lenC = altEnding.length; k<lenC; k++){
	  	repeatInfo[2].push(altEnding[k].getAttribute('n') *1);
	  	repeatInfo[4].push(altEnding2nd[k].getAttribute('n') *1);
	}

	if (repeatInfo[0].length){
		if (repeatInfo[1].length == 0) repeatInfo[1][0] = 1;
		else if (repeatInfo[1][0] > repeatInfo[0][0]) repeatInfo[1].unshift(1);		
	}
	repeatInfo[3] = ending * 1;

	if (dacapo.length){
		repeatInfo.dacapo = dacapo[0].getAttribute('n') *1;
	}

	if (fine.length){
		repeatInfo.fine = fine[0].getAttribute('n') *1;
	}

	if (alcoda.length){
		repeatInfo.alcoda = alcoda[0].getAttribute('n') *1;
		repeatInfo.coda = coda[0].getAttribute('n') *1;
	}

	if (dalsegno.length){
		repeatInfo.dalsegno = dalsegno[0].getAttribute('n') *1;
		repeatInfo.segno = segno[0].getAttribute('n') * 1;
	}


	return repeatInfo;
}
  

