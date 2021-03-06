var audioContext;
var sourceNode;
var startOffset = 0;
var startTime = 0;
var audioFile;
var playingOn=false;
var loadCompleted = false;
var loadInterupted = false;

var currentFileIndex = 1;
var theData = [ [] ];
var midiFile;

var timeSignature =[];
var rptStructure =[];
var measureBeat = [];


var sourceDir = "sourceFilesExample/";
var fileextension = ".csv";
var loadedFileNumber = 0;

var composerArray = [];
var pieceList = []; 
var artistList = [];
//var artistListOfPiece = ['Barenboim, Daniel', 'Bernstein, Leonard', 'Cantelli, Guido', 'Dausgaard, Thomas', 'Furtwaengler, Wilhelm', 'Gardiner, John Eliot', 'Herreweghe, Philippe', 'Karajan, Herbert von', 'Klemperer, Otto', 'Kubelik, Rafael', 'Monteux, Pierre']
var artistListOfPiece = ["Biret, Idil", "Cortot, Alfred", "Cortot, Alfred (2)", "Haas, Monique", "Harasiewicz, Adam", "Horowitz, Vladimir", "Lisiecki, Jan", "Lugansky, Nikolai", "Perahia, Murray", "Pollini, Maurizio", "Richter, Sviatoslav", "Richter, Sviatoslav (2)", "Shebanova, Tatiana", "Vasary, Tamas"];
var selectedAudioList = [];
var selectedAudioPrev = [];
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
	$("#artistSelect").multiselect({
		noneSelectedText: "Select Artists",
		height: 300,
	});


	var items = [];
	
	$.getJSON( "dataWithFile.json", function( data ) {
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
	stop();
	$.xhrPool.abortAll;

	page = 1;

	makeArtistSelectOption(artistListOfPiece, "#artistSelect")



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

	theData[0][1] = getCsv(urlAddress+'beatIndex.csv');


	// for (var i =0, len = artistListOfPiece.length; i<len; i++){
	// 	theData[i+1] = [ [],[] ];
	// 	getAudio(urlAddress,i+1,artistListOfPiece[i])
	// }


	var artistNameList = [];
	currentFileIndex = 1;

	// $.ajax({
 //    // beforeSend: function (xhr) {
 //    //     xhr.setRequestHeader('Authorization', 'Basic ' + btoa('myuser:mypswd'));
 //    // },
	//     url: urlAddress,
	//     success: function (data) {
	//         //List all .png file names in the page
	//         var totalNumberOfRecords = 0;
	//         var index =1;
	//         $(data).find("a").each(function(){
	//         	if(this.href.split('.').pop() == "csv"){
	//         		var fileName = this.href.split("/");
	// 	            var artistName = unescape(fileName[fileName.length-1].split(".")[0])

	// 	            if(artistName!="beatIndex") {
	// 	      			totalNumberOfRecords++;
	// 	            	theData[totalNumberOfRecords]= [[],[] ];  
	// 		            fileList.push(artistName);
	// 		            getAudio(urlAddress,index, artistName);
	// 		            index++;
	// 	            }

	//         	}
	//         })
	//     },
	//     error: function(data){
	//     	console.log("error in loading mp3 files");

	//     }
	// });

}


function getAudioByList(selectedList, url){


	for (var i =0, len = selectedList.length; i<len; i++){
		theData[i+1] = [ [],[] ];
		getAudio(url,i+1,selectedList[i])
	}

}


/*
function audioFileDecoded(audioBuffer){

	var i = 1;

	while (theData[i][0].length){
		i++;
	}

	theData[i][0] = audioBuffer;
	theData[i][1] = getCsv(sourceDir+fileList[i-1]+".csv");
	
	if(i==1) {
		//playSound(audioBuffer);
		//drawProgress(document.getElementById("progressCanvas"));
	}
	
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
*/



function audioFileDecodeFailed(e){
	alert("The audio file cannot be decoded!");
}




function setupAudioNodes() {
  // create a buffer source node
	sourceNode = audioContext.createBufferSource();
  sourceNode2 = audioContext.createBufferSource();
  gainNode1 = audioContext.createGain ?
              audioContext.createGain() : audioContext.createGainNode();
  gainNode2 = audioContext.createGain ?
              audioContext.createGain() : audioContext.createGainNode();
	// and connect to destination
	sourceNode.connect(gainNode1);
  gainNode1.connect(audioContext.destination);
  // create a buffer source node
	// and connect to destination
	sourceNode2.connect(gainNode2);
  gainNode2.connect(audioContext.destination);
}



//audio file playback control


function playSound(audioBuffer) {
	if (loadCompleted == false) return;
	if (startOffset < 0 ) startOffset =0;
	setupAudioNodes(); //이거 사실 한번만 호출해 두면 될 것 같은데...
	startTime = audioContext.currentTime;
  sourceNode.buffer = audioBuffer;
  sourceNode2.buffer = audioBuffer;
  gainNode1.gain.value = 0.5;
  gainNode2.gain.value = 0.0;
  sourceNode.start(0, startOffset % audioBuffer.duration);
  sourceNode2.start(0, startOffset % audioBuffer.duration);
	playingOn = true;
	drawProgress(document.getElementById("progressCanvas"));
}

function pause() {
	if (playingOn == false) return;
	sourceNode.stop();
  	sourceNode2.stop();
	// Measure how much time passed since the last pause.
	startOffset += audioContext.currentTime - startTime;
	playingOn = false;
}

function stop() {
	if (playingOn == false) {
		startOffset = 0;
		return;}
	sourceNode.stop();
  	sourceNode2.stop();
	startOffset = 0;
	playingOn = false;
	drawProgress(document.getElementById("progressCanvas"));
}

function switchAudio(targetIndex){
	if (targetIndex == currentFileIndex) return;

	if(playingOn) {
    sourceNode2.stop();
    sourceNode2 = audioContext.createBufferSource();
    sourceNode2.buffer = sourceNode.buffer;
    gainNode2 = audioContext.createGain();
    sourceNode2.connect(gainNode2);
    gainNode2.connect(audioContext.destination);
    //gainNode2.gain.value = 0.0;
    sourceNode2.start(0, startOffset % sourceNode.buffer.duration);
    sourceNode.stop();
  }

  sourceNode = audioContext.createBufferSource();
  gainNode1 = audioContext.createGain();

	startTime = audioContext.currentTime; // startOffset(상대시간)을 기록하기 위해서는 재생시작 절대시간 startTime을 설정해야함

  sourceNode.connect(gainNode1);
  gainNode1.connect(audioContext.destination);

	sourceNode.buffer = theData[targetIndex][0]; // setupAudioNodes로 다시 만든 sourceNode의 버퍼를 사용자가 선택한 녹음의 오디오 버퍼로 설정
	if (startOffset) startOffset = indexInterpolation(startOffset, theData[currentFileIndex][1], theData[targetIndex][1]); // 재생시간을 앞서 멈췄던 부분과 같은 음표로 조정
	if (isNaN(startOffset)) startOffset = 0; // 에러 방지용


	sourceNode.start(0, startOffset % theData[targetIndex][0].duration); // startOffset 위치에서 소스노드를 시작
  //gainNode1.gain.value = 0.5;
  gainNode2.gain.setValueAtTime(0.5, audioContext.currentTime);
  gainNode1.gain.setValueAtTime(0.0001, audioContext.currentTime);
  gainNode2.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 5);
  gainNode1.gain.exponentialRampToValueAtTime(0.5, audioContext.currentTime + 0.5);
	playingOn = true; //재생상태 갱신

	currentFileIndex = targetIndex; //현재 선택한 녹음 인덱스 갱신
}

function doMouseDown(e){
	//var currentTime = remainingSeconds;
	var rect = e.target.getBoundingClientRect();
	var x= e.clientX-rect.left - e.target.clientLeft + e.target.scrollLeft;

	canvas_x = x/canvasWidth * theData[currentFileIndex][0].length / theData[currentFileIndex][0].sampleRate;
	
	startOffset = canvas_x;

    //move2Measure(playedMeasureNumber, theData[currentFileIndex][1], theData[0][1]);

	if (playingOn){
		pause();
		playSound(theData[currentFileIndex][0]);

	} else {
		var playedMeasureNumber = time2Measure(startOffset, theData[currentFileIndex][1], theData[0][1]);
	    var xmlid = parseMeasure(xmlDoc, playedMeasureNumber);
		if (page != vrvToolkit.getPageWithElement(xmlid)){
	        page = vrvToolkit.getPageWithElement(xmlid);
	        load_page();    		
		}

		$(measureNumber).val(playedMeasureNumber)
	    highlightingMeausre(xmlid);
	}

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

    	var playedMeasureNumber = time2Measure(startOffset + 0.05, theData[currentFileIndex][1], theData[0][1]);
    	var xmlid = parseMeasure(xmlDoc, playedMeasureNumber);
    	if (page != vrvToolkit.getPageWithElement(xmlid)){
	        page = vrvToolkit.getPageWithElement(xmlid);
	        load_page();    		
    	}

    	$(measureNumber).val(playedMeasureNumber)
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
	//var beat = csvBeat[i]

	if(i+1 != csvAudio.length){
		var interpolation = (currentSecond - csvAudio[i]) / (csvAudio[i+1] - csvAudio[i]);
		if(interpolation<0) interpolation = 0;
		var beat =  csvBeat[i] + interpolation * (csvBeat[i+1] - csvBeat[i]);
	} else var beat =  csvBeat[i];

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

	var indexFloor = 0;
	if (candidates.length > 1){
		var playingMeasure = time2orderedMeasure(startOffset, theData[currentFileIndex][1], theData[0][1]);
		indexFloor = candidates.binaryIndexOf(playingMeasure);

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
		if(isNaN(interpolation)) interpolation = 0;
	} else var interpolation = 0;
	var targetSecond = csvAudio[index] + interpolation * (csvAudio[index+1] - csvAudio[index])
	//console.log(currentMeasure);


	return targetSecond
}


function move2Measure(targetMeasure, csvAudio, csvBeat){
	if(playingOn){
		pause();
		startOffset = measure2Time(targetMeasure, csvAudio, csvBeat);
		playSound(theData[currentFileIndex][0]);
	} else{
		startOffset = measure2Time(targetMeasure, csvAudio, csvBeat);
	}

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
	    var i = $.xhrPool.indexOf(xmlhttp);   //  get index for current connection completed
        if (i > -1) $.xhrPool.splice(i, 1); //  removes from list by index

		context.decodeAudioData(xmlhttp.response, function(audioBuffer){
			theData[index][0] = audioBuffer;
			theData[index][1] = getCsv(url+artistName+".csv");
			// var surName = artistName.split(",")[0]
			// var performIndexOfSameArtist = /\([0-9]\)/.exec(artistName);

			// if(performIndexOfSameArtist) surName = surName + " " + performIndexOfSameArtist;

			// if (index==1 ){
			// 	var button='<button class="btn btn-primary" id="'+unescape(artistName)+'" >'+surName+'</button>' 
			// } else{
			// 	var button='<button class="btn btn-default" id="'+unescape(artistName)+'" >'+surName+'</button>'
			// }
            //$("#audioFile-buttons").append(button);

            loadedFileNumber++;

            if (loadedFileNumber == selectedAudioList.length){
            	loadCompleted = true;
            	makeArtistButton(selectedAudioList, "#audioFile-buttons");
            	$(loadAudio).removeClass("btn btn-primary").addClass("btn btn-success");

            }

		}, audioFileDecodeFailed)
    }

    xmlhttp.open("GET",url+artistName+".mp3",true);
    $.xhrPool.push(xmlhttp);
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
		
    	timeSignature = [];
		midiFile = new MIDIFile(xmlhttp.response);
		console.log("get midi work");

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
		var composerName = dataArray[i].name.split(' ')[0]
	    if (composerArray.indexOf(composerName) == -1){
	      composerArray.push(composerName);
	      pieceList[k] = [];
	      artistList[k] = [];
	      // pieceAddress[k] = [];
	      k++;
	  	}
  	}
	composerArray.sort();

	for (var l = 0, clen = composerArray.length; l<clen; l++) {
		$('#composerUl').append('<li><a onclick=composerSelect("'+composerArray[l]+'")>'+composerArray[l]+'</a></li>')
	}


	for (var j = 0, len = dataArray.length; j< len; j++){
    	var composerIndex = composerArray.indexOf(dataArray[j].name.split(' ')[0]);
    	var tempPieceName = getNameByDepth(dataArray[j]);
    	var tempArtistName = getArtistByDepth(dataArray[j]);

    	// var tempAddress = getAddressByDepth(dataArray[j]);

    	for (var n = 0, nlen = tempPieceName.length; n< nlen; n++){
    		pieceList[composerIndex].push(tempPieceName[n]);
    		artistList[composerIndex].push(tempArtistName[n]);
    	}
    	// tempPieceName.forEach(function (d){
    	// 	pieceList[composerIndex].push(d);
    	// 	//artistList[composerIndex][pieceList[composerIndex].length-1] = tempArtistName 
    	// });


    	// tempAddress.forEach(function (e){
    	// 	pieceAddress[composerIndex].push(e);
    	// })
  	}

  	var dummyPieceList = deepCopy(pieceList);
  	var dummyArtistList = deepCopy(artistList);

  	for (var n =0, nlen=pieceList.length; n<nlen; n++){
  		pieceList[n].sort(sortAlphaNum);
  	}

  	for (var n =0, nlen=pieceList.length; n<nlen; n++){
  		for (var nn = 0, nnlen = pieceList[n].length; nn<nnlen; nn++){
  			var index = dummyPieceList[n].indexOf(pieceList[n][nn]);
  			dummyArtistList[n][nn] = artistList[n][index];
  		}
  	}

  	artistList = dummyArtistList;
}

function composerSelect(name){
	$("#dropButtonComposer").text(name);
	var composerIndex = composerArray.indexOf(name);

	$('#pieceUl').empty()

	for (var i=0, len = pieceList[composerIndex].length; i<len; i++){
		var tempPieceName = pieceList[composerIndex][i].replace(name+' ', '').replaceAll(" - ", ' ');
		$('#pieceUl').append('<li><a onclick=pieceSelect(['+composerIndex+','+i+'])>'+tempPieceName+'</a></li>');
	}

}

function pieceSelect(address){

	var url = "sourceFiles/".concat(pieceList[address[0]][address[1]].replaceAll(" - ", "/")).concat("/");
	sourceDir = url;

	if (confirm("Load this piece?") == true) {
		var pieceName = pieceList[address[0]][address[1]];
		pieceName = pieceName.replace(pieceName.split(' ')[0]+' ', '').replaceAll(" - ", ' ')

		$("#dropButtonPiece").text(pieceName);

		artistListOfPiece = artistList[address[0]][address[1]];
		$("#audioFile-buttons").empty();
		selectedAudioList = [];
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
  	if(obj.children[0].type == "folder"){
	    obj.children.forEach(function(d) {
	      var tempPieceName = getNameByDepth(d);
	      tempPieceName.forEach(function(e){
	        nameList.push(pieceName.concat(" - ").concat(e));
	      })
	      //address = address.concat("/").concat(d.name);
	    })
	}
  }

  if(nameList == 0) nameList.push(pieceName);

  return nameList
}

function getArtistByDepth (obj){
  var nameList = [ ];


  if (obj.children){
  	if(obj.children[0].type == "folder"){
	    obj.children.forEach(function(d) {
	      var tempArtistName = getArtistByDepth(d);
	      tempArtistName.forEach(function(e){
	      	nameList.push(e);
	      });
	      //address = address.concat("/").concat(d.name);
	    });
	}else{
		nameList=[ [] ];
		obj.children.forEach(function(d) {
	      var tempArtistName = d.name.split('.')[0];
	      if (tempArtistName != 'beatIndex') nameList[0].push(tempArtistName);
	  	})
	}
  }

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
  



function sortAlphaNum(a,b) {
	var reA = /[^a-zA-Z]/g;
	var reN = /[^0-9]/g;
    var aA = a.replace(reA, "");
    var bA = b.replace(reA, "");
    if(aA === bA) {
        var aN = parseInt(a.replace(reN, ""), 10);
        var bN = parseInt(b.replace(reN, ""), 10);
        return aN === bN ? 0 : aN > bN ? 1 : -1;
    } else {
        return aA > bA ? 1 : -1;
    }
}

function makeArtistButton(inputArray, buttonClass) {
	$(buttonClass).empty();

	inputArray.sort();

	for(var i =0, len=inputArray.length; i<len;i++){
		var artistName = inputArray[i];
		var surName = artistName.split(",")[0]
		var performIndexOfSameArtist = /\([0-9]\)/.exec(artistName);

		if(performIndexOfSameArtist) surName = surName + " " + performIndexOfSameArtist;


		if (i==0){
			var button='<button class="btn btn-primary" id="'+unescape(artistName)+'" >'+surName+'</button>' 
			} else{
			var button='<button class="btn btn-default" id="'+unescape(artistName)+'" >'+surName+'</button>'
		}
	    
	    $(buttonClass).append(button);


	    // if ( $("#audioFile-buttons").find('button').length == theData.length -1 ){
	    // 	loadCompleted = true;
	    // }

	}
}

function makeArtistSelectOption(inputArray, selectClass) {
	$(selectClass).empty();

	inputArray.sort();

	for(var i =0, len=inputArray.length; i<len;i++){
		var artistName = inputArray[i];
		// var surName = artistName.split(",")[0]
		// var performIndexOfSameArtist = /\([0-9]\)/.exec(artistName);

		// if(performIndexOfSameArtist) surName = surName + " " + performIndexOfSameArtist;


		var option='<option value="'+unescape(artistName)+'" >'+artistName+'</button>' 
			
	    
	    $(selectClass).append(option);


	    // if ( $("#audioFile-buttons").find('button').length == theData.length -1 ){
	    // 	loadCompleted = true;
	    // }

	}
   	$(selectClass).multiselect("refresh");
   	$(selectClass).multiselect({
		minWidth: 200
	});
}




function deepCopy(obj) {
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
}


$(function() {
    $.xhrPool = [];
    $.xhrPool.abortAll = function() {
        $(this).each(function(i, jqXHR) {   //  cycle through list of recorded connection
            jqXHR.abort();  //  aborts connection
            $.xhrPool.splice(i, 1); //  removes from list by index
        });
    }

    $.ajaxSetup({
        beforeSend: function(jqXHR) { $.xhrPool.push(jqXHR); }, //  annd connection to list
        complete: function(jqXHR) {
            var i = $.xhrPool.indexOf(jqXHR);   //  get index for current connection completed
            if (i > -1) $.xhrPool.splice(i, 1); //  removes from list by index
        }
    });
})


function arraysEqual(arr1, arr2) {
    if(arr1.length !== arr2.length)
        return false;
    for(var i = arr1.length; i--;) {
        if(arr1[i] !== arr2[i])
            return false;
    }

    return true;
}

