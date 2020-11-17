tp = "";
xh = new XMLHttpRequest();
xh.onreadystatechange = function(){
	if (this.readyState == 4 && this.status == 200){
		translateList = JSON.parse(this.responseText);
		for (i in translateList){
			document.getElementById(tp+i).innerText = translateList[i];
		}
	}
}

xh.open("GET",locale+".json",true);
xh.send();
