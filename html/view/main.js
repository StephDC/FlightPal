document.getElementsByTagName("main")[0].style.display="block";
document.getElementById("jswarn").children[0].innerText = "Page loading...";

qrcode.stringToBytes = qrcode.stringToBytesFuncs["UTF-8"];

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
xh.open("GET","/cgi-bin/flightpal.py?action=entry",true);
xh.send();

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
	} else if (this.readyState == 4){
		xh.open("GET","../flight.json",true);
		xh.send();
	}
}

xh.open("GET","../flight.json",true);
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
		xh.open("GET","../airline.json",true);
		xh.send();
	}
}
xh.open("GET","../airline.json",true);
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
		xh.open("GET","../airport.json",true);
		xh.send();
	}
}
xh.open("GET","../airport.json",true);
xh.send();

function getBoardingPass(){
	document.getElementById("f_login").disabled=true;
	xh = new XMLHttpRequest();
	xh.onreadystatechange = function(){
		if (this.readyState == 4){
			if (this.status != 200){
				alert("Login with your name and password failed. Please try again.");
				document.getElementById("login").style.display = "block";
				document.getElementById("f_user").focus();
			} else {
				window.localStorage.setItem("user",document.getElementById("f_user").value);
				window.localStorage.setItem("pass",document.getElementById("f_pass").value);
				document.getElementById("login").style.display = "none";
				flightInfo = JSON.parse(this.responseText);
				document.getElementById("b_airline").innerText = airlineList[flightInfo.airline][locale].toUpperCase();
				document.getElementById("b_flight").innerText = flightInfo.flightno;
				document.getElementById("b_date").innerText = printDate(getDate(flightInfo.date));
				document.getElementById("b_seq").innerText = flightInfo.seq;
				var finfo = flightList.getflight(airlineList[flightInfo.airline].IATA,flightInfo.flightno);
				document.getElementById("b_dep").innerText = finfo.depart + " " + airportList[airportList.iataicao(finfo.depart)][locale].toUpperCase();
				document.getElementById("b_deptime").innerText = finfo.departtime.h.toString()+':'+(finfo.departtime.m<10?'0'+finfo.departtime.m.toString():finfo.departtime.m.toString());
				document.getElementById("b_arr").innerText = finfo.arrive + " " + airportList[airportList.iataicao(finfo.arrive)][locale].toUpperCase();
				document.getElementById("b_arrtime").innerText = finfo.arrivetime.h.toString()+':'+(finfo.arrivetime.m<10?'0'+finfo.arrivetime.m.toString():finfo.arrivetime.m.toString());
				for (i = 0; i < flightInfo.pal.length; i+=1){
					t = document.createElement("tr");
					t2 = document.createElement("td");
					t2.innerText = flightInfo.pal[i][0];
					t.appendChild(t2);
					t2 = document.createElement("td");
					t2.innerText = flightInfo.pal[i][1];
					t.appendChild(t2);
					t2 = document.createElement("td");
					if (flightInfo.pal[i][2].length > 0){
						t3 = document.createElement("a");
						t3.href = flightInfo.pal[i][2];
						t3.innerText = flightInfo.pal[i][2];
						t2.appendChild(t3);
						var qr = qrcode(0,"M");
						qr.addData(flightInfo.pal[i][2],"Byte");
						qr.make();
						t3 = document.createElement("div");
						t3.innerHTML = qr.createSvgTag({'scalable':true});
						t2.appendChild(t3);
					}
					t.appendChild(t2);
					document.getElementById("pallist").appendChild(t);
				}
				t = new Date(flightInfo.update*1000);
				document.getElementById("p_update").innerText = t.toLocaleString();
				document.getElementById("boardingpass").style.display = "block";
				document.getElementById("pals").style.display = "block";
			}
			document.getElementById("f_login").disabled = false;
		}
	}
	xh.open("GET","/cgi-bin/flightpal.py?action=get&name="+encodeURIComponent(document.getElementById("f_user").value)+"&password="+encodeURIComponent(document.getElementById("f_pass").value),true);
	xh.send();
}

if (window.localStorage.getItem("user") !== null && window.localStorage.getItem("pass") !== null){
	document.getElementById("f_user").value = window.localStorage.getItem("user");
	document.getElementById("f_pass").value = window.localStorage.getItem("pass");
	getBoardingPass();
} else {
	document.getElementById("f_login").onclick = getBoardingPass;
	document.getElementById("login").style.display = "block";
}

document.getElementById("jswarn").style.display = "none";
