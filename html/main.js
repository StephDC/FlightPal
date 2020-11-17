document.getElementsByTagName("main")[0].style.display="block";
document.getElementById("jswarn").children[0].innerText = "Page loading...";

// Determine user language
locale = navigator.language
if (locale.substr(0,2) === "en") locale = 'en-US';
else if (locale.substr(0,2) === "ja") locale = 'ja-JP';
else if (locale.substr(0,2) === "zh")
	if (locale.substr(3) === 'CN') locale = 'zh-CN';
	else locale = 'zh-CN'; // Change to zh-TW when translated.
else locale = 'en-US';

engmon = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
function getDate(d){
	var tmp = d.split('-');
	var result = new Date(parseInt(tmp[0]),parseInt(tmp[1])-1,parseInt(tmp[2]));
	delete tmp;
	return result;
}

function printDate(d){
	return (d.getDate()<10?"0":"")+d.getDate().toString()+engmon[d.getMonth()]+d.getFullYear().toString().substr(2);
}

xh = new XMLHttpRequest();
xh.onreadystatechange = function(){
	if (this.readyState == 4){
		if (this.status == 200) document.getElementById("f_entry").innerText = this.responseText.trim();
		else document.getElementById("f_entry").innerText = "Unknown";
	}
}
xh.open("GET","/cgi-bin/flightpal.py?action=entry",true)
xh.send();
// Updates flight list...

xh = new XMLHttpRequest();
xh.onreadystatechange = function(){
	if (this.readyState == 4 && this.status == 200){
		flightList = JSON.parse(this.responseText);
		flightList.getflight = function(a,n){
			for (i=0; i<this.length; i++) if (this[i].airline === a && this[i].flightno === n) return this[i];
			return undefined;
		}
		flightList.hasflight = function(a,n){
			return this.getflight !== undefined;
		}
		for (i = 0; i < flightList.length;){
			t = document.createElement("option");
			t.value = flightList[i].airline + flightList[i++].flightno.toString();
			document.getElementById("flightlist").appendChild(t);
		};
	} else if (this.readyState == 4){
		xh.open("GET","flight.json",true);
		xh.send();
	}
}

xh.open("GET","flight.json",true);
xh.send();

xh = new XMLHttpRequest();
xh.onreadystatechange = function(){
	if (this.readyState == 4 && this.status == 200){
		airlineList = JSON.parse(this.responseText);
		airlineList.iataicao = function(iata){
			for (i in this) if (this[i].IATA === iata) return i;
			return undefined;
		}
	} else if (this.readyState == 4){
		xh.open("GET","airline.json",true);
		xh.send();
	}
}
xh.open("GET","airline.json",true);
xh.send();

xh = new XMLHttpRequest();
xh.onreadystatechange = function(){
	if (this.readyState == 4 && this.status == 200){
		airportList = JSON.parse(this.responseText);
		airportList.iataicao = function(iata){
			for (i in this) if (this[i].IATA === iata) return i;
			return undefined;
		}
	} else if (this.readyState == 4){
		xh.open("GET","airport.json",true);
		xh.send();
	}
}
xh.open("GET","airport.json",true);
xh.send();
// Get the Check Flight button ready

function showFlightNumError(reason){
	alert(reason);
	document.getElementById("f_flightno").focus();
}

document.getElementById("checkflight").onclick = function(){
	var tmp = document.getElementById("f_flightno").value.trim();
	if (tmp.length < 3) return showFlightNumError("Sorry, the flight number you entered is too short.");
	if (tmp.charCodeAt(2) < 48 || tmp.charCodeAt(2) > 57){
		al = tmp.substr(0,3);
		fn = parseInt(tmp.substr(3));
	} else {
		al = airlineList.iataicao(tmp.substr(0,2));
		fn = parseInt(tmp.substr(2));
	}
	delete tmp;
	dt = getDate(document.getElementById("f_date").value);
	if (airlineList[al] === undefined || isNaN(fn)) return showFlightNumError("Sorry, the flight number you entered has a format not supported by us. Please recheck your flight number.");
	if (!flightList.hasflight(airlineList[al].IATA,fn)) return showFlightNumError("Sorry, the flight number you entered is not tracked in our website.");
	if (isNaN(dt)) return showFlightNumError("Sorry, the date you entered has a format not supported by us. Please enter it with the format of YYYY-MM-DD.");
	var finfo = flightList.getflight(airlineList[al].IATA,fn);
	if (finfo.dayofweek.indexOf(dt.getDay()) === -1) return showFlightNumError("Sorry, the flight does not operate on the date you specified.");
	document.getElementById("b_airline").innerText = airlineList[al][locale].toUpperCase();
	document.getElementById("b_seq").innerText = "Loading...";
	xh = new XMLHttpRequest();
	xh.onreadystatechange = function(){
		if (this.readyState == 4 && this.status == 200){
			document.getElementById("b_seq").innerText = 1+parseInt(this.responseText);
		} else if (this.readyState == 4){
			alert("API Error: Could not get your sequence number.");
			docuemnt.getElementById("b_seq").innerText = "Unknown";
		}
	}
	xh.open("GET","/cgi-bin/flightpal.py?action=count&airline="+al+"&flightno="+fn+"&date="+encodeURIComponent(document.getElementById("f_date").value),true);
	xh.send();
	document.getElementById("p_airline").value = al;
	document.getElementById("b_date").innerText = printDate(dt);
	document.getElementById("p_date").value = document.getElementById("f_date").value;
	document.getElementById("b_flight").innerText = fn;
	document.getElementById("p_flightno").value = fn;
	document.getElementById("b_dep").innerText = finfo.depart + " " + airportList[airportList.iataicao(finfo.depart)][locale].toUpperCase();
	document.getElementById("b_deptime").innerText = finfo.departtime.h.toString()+':'+(finfo.departtime.m<10?'0'+finfo.departtime.m.toString():finfo.departtime.m.toString());
	document.getElementById("b_arr").innerText = finfo.arrive + " " + airportList[airportList.iataicao(finfo.arrive)][locale].toUpperCase();
	document.getElementById("b_arrtime").innerText = finfo.arrivetime.h.toString()+':'+(finfo.arrivetime.m<10?'0'+finfo.arrivetime.m.toString():finfo.arrivetime.m.toString());
	delete finfo;
	if (window.localStorage.getItem("user") !== null) document.getElementById("p_name").value = window.localStorage.getItem("user");
	document.getElementById("boardingpass").style.display = "block";
	document.getElementById("pi").style.display = "block";
}

// Form Duplication Check
document.getElementById("p_submit").onclick = function(){
	if (document.getElementById("p_pass").value !== document.getElementById("p_confirmpass").value){
		alert("Your password differs from your confirm password. Did you make a typo somewhere?");
		document.getElementById("p_pass").focus();
		return;
	}
	if (document.getElementById("p_name").value === ""){
		alert("A name or nickname is required.");
		document.getElementById("p_name").focus();
		return;
	}
	if (document.getElementById("p_contact").value === "") {
		alert("A contact info is required.");
		document.getElementById("p_contact").focus();
		return;
	}
	this.disabled=true;
	xh = new XMLHttpRequest();
	xh.onreadystatechange = function(){
		if (this.readyState == 4){
			if (this.responseText.trim() === "error"){
				alert("API Error: Could not submit your contact info.");
			} else if (this.responseText.trim() === "name") {
				alert("Your nickname has been registered. If you registered this nickname, please enter the correct password.");
				document.getElementById("p_name").focus();
			} else if (this.responseText.trim() === "contact") {
				alert("Your contact information is the same as someone else. If you registered before, please use the same nickname and password.");
				document.getElementById("p_contact").focus();
			} else {
				window.localStorage.setItem("user",document.getElementById("p_name").value);
				window.localStorage.setItem("pass",document.getElementById("p_pass").value);
				document.getElementById("p_form").submit();
			}
			document.getElementById("p_submit").disabled=false;
		}
	}
	xh.open("GET","/cgi-bin/flightpal.py?action=check&name="+encodeURIComponent(document.getElementById("p_name").value)+"&password="+encodeURIComponent(document.getElementById("p_pass").value)+"&contact="+encodeURIComponent(document.getElementById("p_contact").value)+"&url="+encodeURIComponent(document.getElementById("p_url").value),true);
	xh.send();
};

QrScanner.WORKER_PATH = "qr-scanner/qr-scanner-worker.min.js";

document.getElementById("p_qrcode").onchange = function(){
	if (document.getElementById("p_qrcode").files.length === 0) return;
	document.getElementById("p_url").disabled=true;
	document.getElementById("p_url").value="Loading from QR code...";
	document.getElementById("p_submit").disabled=true;
	QrScanner.scanImage(document.getElementById("p_qrcode").files[0]).then(result=>document.getElementById("p_url").value=result).catch(error=>alert("QR Code error: "+(error || "No QR code detected.")));
	document.getElementById("p_url").disabled=false;
	document.getElementById("p_submit").disabled=false;
};

document.getElementById("jswarn").style.display = "none";
