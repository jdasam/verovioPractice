function findMeiIDorVelocity(noteArray, searchkeyNote, option_indexOnly){
	//midiNote = [pitch, velocity, absolute onset time in beat]
	// mei = xml mei note array

	// if noteArray is mei, return xmlid
	// if noteArray is midi, return velocity

	var minIndex = 0;
	var maxIndex = noteArray.length - 1;
	var currentIndex;
	var currentElement;
	var diff;
	var minimumDiff;

	if (searchkeyNote) var searchElement = searchkeyNote.beatIndex
	else return

    var midiMeasure = measureBeat.binaryIndexOf(searchElement);
    searchElement = searchElement - (measureBeat[midiMeasure] - midiBeat2xmlBeat[midiMeasure]);

	// if (searchElement < meiNoteArray[minIndex].beatIndex){
	// 	return 0;
	// }

	while (minIndex < maxIndex) {
	    currentIndex = (minIndex + maxIndex) / 2 | 0;
	    currentElement = noteArray[currentIndex].beatIndex;
	    //console.log([currentElement, minIndex, maxIndex])

	    if (currentElement < searchElement  ) {
	        minIndex = currentIndex+1;
	    }
	    else if (currentElement > searchElement) {
	        maxIndex = currentIndex - 1;
	    }
	    else { //currentElement = searchElement
	    	break
	    }
	}


	if (noteArray.find(function(e){ return e.beatIndex ===searchElement }))
		minIndex = noteArray.findIndex(function(e){ return e.beatIndex ===searchElement });

	if (maxIndex != noteArray.length - 1){
		while(noteArray[currentIndex+1].beatIndex==searchElement) currentIndex++;
	    	maxIndex = currentIndex;}

	// if (currentIndex != 0){
	//     while(noteArray[currentIndex-1].beatIndex==searchElement) currentIndex += -1;
	//     	minIndex = currentIndex;
	// }
	for (var i=0, len=maxIndex-minIndex+1; i<len;i++){
		if (noteArray[minIndex+i].pitch == searchkeyNote.pitch){
			if (option_indexOnly) return minIndex+i
			if (noteArray[minIndex+i].xmlid) return noteArray[minIndex+i].xmlid
			if (noteArray[minIndex+i].velocity) return noteArray[minIndex+i].velocity
		}
	}

	// if there is no note with the same pitch, return the velocity of adjacent note
	// if (noteArray[minIndex+i].velocity) return noteArray[minIndex+i].velocity
}

function mei2midiMatching(midiNotes, meiNotes){
	var mappingList = []
	for (var i=0, len=meiNotes.length; i<len;i++){
		mappingList[i] = findMeiIDorVelocity(midiNotes, meiNotes[i], true);
	}
	for (var i=0, len=meiNotes.length; i<len;i++){
		if (typeof mappingList[i] == 'undefined'){
            // var beat = meiNotes[i].beatIndex; //xmlbeat
            // var midiMeasure = midiBeat2xmlBeat.binaryIndexOf(beat) // 
            // var midiBeat = beat + (measureBeat[midiMeasure] - midiBeat2xmlBeat[midiMeasure]);

			var candidates = midiNotes.filter(function(e){return (Math.abs(e.beatIndex-meiNotes[i].beatIndex) < 1) });
			for (var j=0, canLen = candidates.length; j<canLen; j++){
				if (candidates[j].pitch == meiNotes[i].pitch && mappingList.indexOf(midiNotes.indexOf(candidates[j])) == -1 ){
					mappingList[i] = midiNotes.indexOf(candidates[j]);
				}
			}
		}		
	}



	return mappingList
}



function meiNote2beatArray(mei){
	var numberOfMeasures = $(mei).find('measure').length
	var noteLabel_BeatArray = []; // 

	for (var n =1; n<=numberOfMeasures; n++){
		var measureStartBeat = midiBeat2xmlBeat[rptStructure.indexOf(n)]; // save the beat position of measure start
		// var measureStartBeat = xmlBeat2midiBeat[n]; 
		var layers = $(mei).find('measure[n="' + n + '"]').find('layer')
		for (var i=0, len= layers.length ; i<len; i++){
			var numberOfnotes = $(layers[i]).find('note, rest').length
			// var numberOfTuplets = $(layers[i]).find('tuplet').length
			var beatIndexInLayer = measureStartBeat;
			for (var j=0; j < numberOfnotes; j++){
				var note = $(layers[i]).find('note, rest')[j];
				var dots = note.getAttribute('dots')
				var tuplet = (note.parentElement.parentElement.tagName == 'tuplet' || note.parentElement.tagName == 'tuplet' );
				var tupletType = note.parentElement.parentElement.getAttribute('num') / note.parentElement.parentElement.getAttribute('numbase');
				if (tuplet &&  (typeof(tupletType) == "undefined" || isNaN(tupletType) ))tupletType = note.parentElement.getAttribute('num') / note.parentElement.getAttribute('numbase')
				var noteBeatLength = 4 / Number(note.getAttribute('dur'));
				if (dots==1) noteBeatLength = noteBeatLength * 1.5; 
				if (tuplet) noteBeatLength = noteBeatLength/ tupletType;
				if (note.getAttribute('grace')) noteBeatLength = 0;
					
				if (note.tagName == 'note'){
					var noteLabel = note.getAttribute('xml:id');
					var notePitch = Number(note.getAttribute('pnum'));
					// noteLabel_BeatArray.push([noteLabel, notePitch, beatIndexInLayer]);
					// noteLabel_BeatArray[0].push(noteLabel);
					// noteLabel_BeatArray[1].push(notePitch);
					// noteLabel_BeatArray[2].push(beatIndexInLayer);
					noteLabel_BeatArray.push({'xmlid': noteLabel, 'pitch': notePitch, 'beatIndex':beatIndexInLayer, 'endIndex':beatIndexInLayer + noteBeatLength})
				}

				if (note.parentElement.tagName == "chord"){ //if this note is in chord,
					if ($(note).is(":last-child")){
						noteBeatLength = 4/ Number(note.parentElement.getAttribute('dur'));
						if (note.parentElement.parentElement.parentElement.tagName == 'tuplet') noteBeatLength = noteBeatLength/ note.parentElement.parentElement.parentElement.getAttribute('num') * note.parentElement.parentElement.parentElement.getAttribute('numbase');
						if (note.parentElement.getAttribute('dots') == 1) noteBeatLength = noteBeatLength * 1.5
						beatIndexInLayer += noteBeatLength;
					}
				}
				else beatIndexInLayer += noteBeatLength;
			}
		}
	}
	noteLabel_BeatArray.sort(function(a,b){
		return a.beatIndex - b.beatIndex
	});

	return noteLabel_BeatArray
}
