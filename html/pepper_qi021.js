var lineMap = [];
var lineTextArea = {};
var session = new QiSession();

//Pepperにデータを送るための区切り文字を定義します。

function sendPepperFromTablet(sendsObj){

	//alert(typeof sendsObj);
	//alert(sendsObj);

	actionGroup = [""];
	
	if(typeof sendsObj == "string"){
		actionGroup = sendsObj.split(commandSplit);
	}
	else{
		actionGroup[0] = sendsObj.id;
	}

	sendCommands = "";
	var failureData = false;
	
	//alert("length:::"+actionGroup.length);
	
	for(var i=0 ; i<actionGroup.length ; i++){
		//alert("loop"+i);
		id = actionGroup[i];
		//baseObj = document.getElementById(id);
		
		data = id.split(spliterKey);
		//alert(data);
		action = "";
		operateId = "";
		dataType = "";
		goMthod = "";
		sendValue = "";
		
		switch(data.length){
			case 3:
				action = data[0];
				operateId = data[1];
				dataType = data[2];
				break;
			default:
				alert("『"+spliterKey+"』でつなぐべきデータの要素が多すぎるか少なすぎます。:::" + id);
				failureData = true;
				break;
		}

		if(!failureData && action.indexOf("sendPepper") != 0){
			alert("『sendPepper』という接頭辞でPepperにデータを送る要素であることが宣言されてません:::" + action);
			failureData = true;
		}

		//alert(action.indexOf("GoMethod"));
		
		if(action.indexOf("GoMethod") == -1){
			operateObj = document.getElementById(operateId);
			if(operateObj == null){
				frames = document.getElementsByTagName("iframe");
				//alert(frames);
				for(var j=0 ; j<frames.length ;j++){
					//alert(frames[j].contentWindow);
					if(typeof(frames[j].contentWindow) != "undefined"){
						x = frames[j].contentWindow.document.getElementById(operateId);
					}
					else{
						x = frames[j].document.getElementById(operateId);
					}
					//alert("try get!  :"+x);
					if(x != null){
						operateObj = x;
						break;
					}
				}
			}
			
			if(!failureData && operateObj == null){
				alert(operateId+"というId名の要素がこのHtml文書内に見つかりません。");
				failureData = true;
			}

			if(!failureData && dataType.indexOf("ValueElement") != 0 && dataType.indexOf("TextElement") != 0 ){
				alert("データをvalueプロパティから取得するのかtextプロパティから取得するのかを『ValueElement』もしくは『TextElement』で明示してください:::" + dataType);
				failureData = true;
			}
			
		}
		else{
			sendValue = operateId ;
		}

		if(failureData){
			sendCommands = "";
			break;
		}
		
		//action = data[0];
		//operateId = data[1];
		//dataType = data[2];
		//alert("base:::"+baseObj);

		if(dataType.indexOf("TextElement") == 0){
			sendValue = operateObj.innerText;

			if(action.indexOf("SayLine") != -1){
				areaPosition = -1;
				splitChar = sendValue.substring(0,1);
				splitCont = sendValue.split(splitChar);
				
				isAdd = false;
				
				if(lineMap.length == 0){
				areaPosition = 0;
				isAdd = true;
				}
				else{
					for(var x = 0 ; x<lineMap.length ; x++){
						area = lineMap[x];
						if(area[operateId] != undefined){
							//alert("get turn:::"+area[operateId]);
							lineTextArea = lineMap[x];
							areaPosition = x;
							isAdd = false;
							break;
						}
					isAdd = true;
					}
				}

				if(isAdd){
					//alert("array push");
					lineTextArea = {};
					lineTextArea[operateId] = 0;
					lineMap.push(lineTextArea);
					//alert("length:::" + lineMap.length);
					areaPosition = lineMap.length-1;
				}
				
				turn = lineTextArea[operateId] + 1;

				if(turn>splitCont.length-1){
					turn = 1;
				}

				lineMap[areaPosition][operateId] = turn;
				//alert("next::::::"+lineMap[areaPosition][operateId]);
				
				sendValue = splitCont[turn];
				action = "sendPepperSay";
				//alert("value::" + sendValue);
			}
				
		}

		if(dataType.indexOf("ValueElement") == 0){
			sendValue = operateObj.value;
		}
		
		sendCommands = sendCommands + '["' + action  + '","'  + operateId +  '","' + sendValue + '"]' + commandSplit;

		//alert("command:::"+sendCommands);
		//alert("i:::"+i);
	}

	if(sendCommands == ""){
		alert("途中でエラーになりました");
	}
	else{
		sendCommands = sendCommands.substring(0,sendCommands.length-commandSplit.length);
		sendPepperFromTabletByCommand(sendCommands);
	}

}

function sendPepperFromTabletByCommand(sendCommands){
	sendCommands = sendCommands.replace(/\r/g, "");
	sendCommands = sendCommands.replace(/\n/g, "");
	sendCommands = "'" + sendCommands +"'";
	
	//alert(sendCommands);
	//alert("sendBlock");
	
	if(showSendStringArea != null){
		if(window == window.parent){
			document.getElementById(showSendStringArea).value = sendCommands;
		}
		else{
			window.parent.document.getElementById(showSendStringArea).value = sendCommands;
		}
	}

	//alert("sessionBlock");
	if(session != null){
		session.service("ALMemory").done(function (ALMemory) {
			ALMemory.raiseEvent("PepperQiMessaging/fromTablet", sendCommands);
		});
	}
}


function toTabletHandler(value) {
	comArray = new Array();

	if(value.indexOf(commandSplit) != -1){
		comArray = value.split(commandSplit);
	}
	else{
		comArray.push(value);
	}
	
	for(var i=0 ; i<comArray.length ; i++){
	    reciveTabletFromPepper(comArray[i]);
	}
}

function startSubscribe() {
	session.service("ALMemory").done(function (ALMemory) {
		ALMemory.subscriber("PepperQiMessaging/toTablet").done(function(subscriber) {
			subscriber.signal.connect(toTabletHandler);
		});
    });
}

function reciveTabletFromPepper(commands){
	//alert(commands);

	commands = commands.replace(/\'/g,"");

	jsonObj = JSON.parse(commands);
	
	id = jsonObj["name"];
	type = jsonObj["type"];
	data = jsonObj["data"];

	parts = document.getElementById(id);
	
	//alert(id);
	//alert(type);
	//alert(data);
	//alert(parts);
	//alert(document);
	
	if(parts == null){
		
		//list = document.childNodes;
		list = document.getElementsByTagName("iframe");
		//alert(list);
		for (var i = 0; i < list.length; i++) {
			x = list[i];
			
			child = x.contentDocument || x.contentWindow.document;
			
			dd = child.getElementById(id);
			
			if(dd != null){
				parts = dd;
				break;
			}
		}
	}
	
	//salert(parts);
	
	partsType = parts.tagName;

	//alert("["+type+"]");
	///alert("["+partsType+"]");
	
	if(type == "CLASS"){
		parts.className = data;
	}
	
	if(type == "STYLE"){
		parts.style.cssText = data;
	}
	
	if(partsType.indexOf(type) != -1){
		if(type == "INPUT"){
			parts.value = data;
			//alert("INPUT ON");
		}
		if(type == "SELECT"){
			parts.value = data;
			//alert("INPUT ON");
		}
		if(type == "SPAN"){
			parts.innerHTML = data;
			//alert("SPAN ON");
		}
		if(type == "DIV"){
			parts.innerHTML = data;
			//alert("DIV ON");
		}
		if(type == "TABLE"){
			copyTable(parts,data);
			//alert("TABLE ON");
		}
		
		if(type == "BUTTON"){
			var evt = document.createEvent("MouseEvents"); 
			evt.initEvent( "click", false, true );
			parts.dispatchEvent(evt);
			//alert("BUTTON ON");
		}
		
	}
		
}

function testReciveTabletFromPepper(){
	commands = document.getElementById("recivePepperCommands").value;
	toTabletHandler(commands);
	//reciveTabletFromPepper(commands);
}

function copyTable(parts,data){
	//alert("copy table start");
	//alert(data);
	
	for(var h = parts.rows.length-1 ; h >=0 ; h--){
		parts.deleteRow(h);
	}

	if(data.indexOf("[") == 0){
		//alert("type1");
		dataJSON = JSON.parse(data);
		maxLine = Object.keys(dataJSON).length;
		
		maxCell = 0;
		cellTitle = [];
		for(var j=0 ; j<maxLine ; j++){
			c = dataJSON[j];
			for(key in c){
				if(cellTitle.indexOf(key) == -1){
					cellTitle.push(key);
				}
			}
		}
		
		maxCell = cellTitle.length;

		tr = document.createElement("tr");
		widthValue = (100/maxCell) + "%";
		for(name in cellTitle){
			th = document.createElement("th");
			th.innerHTML = cellTitle[name];
			th.className = "viewCell";
			th.style.width = widthValue;
			tr.appendChild(th); 
		}
		
		for(var l=0 ; l<maxLine ; l++){
			row = parts.insertRow(l);
			
			trClass = "oddLine";
			if( (l % 2) == 0){
				trClass = "evenLine";
			}
			
			row.className = trClass;
			
			for(var m=0 ; m<maxCell ; m++){
				c = row.insertCell(m);
				c.innerHTML = "";
				c.className = "viewCell";
			}
		}

		for(var n=0 ; n<maxLine ; n++){
			d =dataJSON[n];
			for(key in d){
				e = cellTitle.indexOf(key);
				parts.rows(n).cells(e).innerHTML = dataJSON[n][key];
				
			}
		}

		parts.insertBefore(tr,parts.firstChild);

	}
	
	if(data.indexOf("\n") != -1 && data.indexOf(",") != -1){
		
		line = data.split("\n");
		//alert("type2");
		
		maxLine = line.length;
		maxCell = 0;
		
		for(var j=0 ; j<line.length ; j++){
			cell = line[j].split(",");
			if(maxCell<cell.length){
				maxCell = cell.length;
			}
		}
		
		//alert("table行数"+maxLine);
		//alert("table列数"+maxCell);
		
		for(var j=0 ; j<line.length ; j++){
			row = parts.insertRow(j);
			trClass = "oddLine";
			if( (j % 2) == 0){
				trClass = "evenLine";
			}
			row.className = trClass;
			cell = line[j].split(",");
			for(var k=0 ; k<cell.length ; k++){
				c = row.insertCell(k);
				c.innerHTML = cell[k];
				c.className = "viewCell";
			}
		}
	}
	
	if(data.indexOf("<tr>") != -1){
		//alert("typeHTML");

		data = data.replace("<tr>","");
		
		line = data.split("</tr>");
		
		maxLine = line.length-1;
		maxCell = 0;
		
		for(var j=0 ; j<line.length ; j++){
			cell = line[j].split("<td>");
			if(maxCell<cell.length){
				maxCell = cell.length;
			}
		}
		
		//maxCell = maxCell-1;
		
		//alert("table行数"+maxLine);
		//alert("table列数"+maxCell);

		for(var j=0 ; j<maxLine ; j++){
			row = parts.insertRow(j);
			trClass = "oddLine";
			if( (j % 2) == 0){
				trClass = "evenLine";
			}
			row.className = trClass;
			cell = line[j].split("</td>");
			for(var k=0 ; k<cell.length-1 ; k++){
				c = row.insertCell(k);
				c.innerHTML = cell[k];
				c.className = "viewCell";
			}
		}

		
	}
	
}

function buttonAnchor(htmlName) {
	parent.body_contents.location.href = htmlName;
}

function buttonAnchorNew(url) {
	window.open(url);
}
