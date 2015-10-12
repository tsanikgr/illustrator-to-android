if (app.documents.length < 1) exit();
var doc = app.activeDocument;
var docName = doc.name;
if (doc.path == ""){
	alert("Please save the document first with the altas name.");
	exit();
}

/***************************************************************/

var EXPORT_PNG = "*";
var EXPORT_LAYOUT = "+";
var EXPORT_BOTH = "#"

var artboardH = doc.height;

var lowResolutionScale = 71.14583333;
var highResolutionScale = 100;

var hiddenForNow = [];
var x=0,y=0,w=0,h=0;
var xmlStr = "";
var openedGroups = [];
var currentlyGrouping = false;
var groupNames = [];
var lastGroup = "";

process(doc.pageItems);
// process(visibleDocLayers);

var xmlFilePath = doc.path;
xmlFilePath.changePath('../../layout/' + sub(docName,0,docName.length-3) + ".xml")
saveXML(xmlFilePath, xmlStr);

/***************************************************************/

function process(objs) {

	var name;
	var reShow;

	xmlStr += '<?xml version="1.0" encoding="utf-8" ?>\r\n';
	xmlStr += '<group name="'+sub(docName,0,docName.length-3)+'"\r\n';
	xmlStr += 'xmlns="http://www.w3schools.com" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\r\n';
	xmlStr += 'xsi:schemaLocation="http://www.w3schools.com StageBuilder.xsd">\r\n\r\n';

	for (var i = objs.length-1 ; i >= 0 ; i--) {
		var o = objs[i];

		reHide = false;
		if (o == null || typeof o.name == 'undefined') continue;
		name = o.name;

		groupNames = [];
		getGroupNames(o.parent);
		closeAndOpenGroups();

		if (!exportLayout(name) && !exportPng(name)) continue;

		if (o.hidden) {
			reHide = true;
			o.hidden = false;
		}

		hideUnrelated(o, objs);

		if (exportPng(name)) {
			var savePath = doc.path;
			var pngName = getPNGName(o) +  ".png";
			savePath.changePath(sub(doc.name,0,doc.name.length-3)+"/1366x768/" + pngName);
			savePNG(savePath, lowResolutionScale, false);

			savePath = doc.path;
			savePath.changePath(sub(doc.name,0,doc.name.length-3)+"/1920x1080/" + pngName);
			savePNG(savePath, highResolutionScale, false);
		}

		if (exportLayout(name)) {
			for (var j = 0; j < openedGroups.length ; j++) {
				xmlStr += "\t";
			}

			x = o.visibleBounds[0];
			y = o.visibleBounds[3] + artboardH;
			w = o.visibleBounds[2] - x;
			h = o.visibleBounds[1] + artboardH - y;
			xmlStr += createElement(o);
		}

		showUnrelated();
		if (reHide) o.hidden = true;
	}

	groupNames = [];
	closeAndOpenGroups();
	xmlStr += "</group>";
}

/**************************************************************************/

function getGroupNames(o) {
	if (o == null || typeof o == 'undefined') return;
	if (o.typename == "Layer" && sub(o.name,0,1) == "+") {
		groupNames[groupNames.length] = sub(o.name,1,-1);
	}
	getGroupNames(o.parent);
}

function closeAndOpenGroups(){

	if ((openedGroups.length > 0) && (groupNames.length > 0)) {
		var n = 0;

		// check common
		for (var i = 0 ; i < ((openedGroups.length < groupNames.length) ? openedGroups.length : groupNames.length) ; i++) {
			if (openedGroups[openedGroups.length-i-1] != groupNames[groupNames.length-i-1]) {

				n = openedGroups.length - i;
				if (n > 0) {
					for (var j = 0 ; j < n ; j++) {
						xmlStr += "</group>\r\n";
					}
					openedGroups.splice(0,n);
				}
				break;
			}
		}

		//remove
		n = openedGroups.length - groupNames.length;
		for (var i = 0 ; i < n ; i++) {
			xmlStr += "</group>\r\n";
		}
		if (n > 0) {
			openedGroups.splice(0,n);
		}

		//add
		n = groupNames.length - openedGroups.length;
		for (var i = 0 ; i < n ; i++) {
			openedGroups.splice(i,0,groupNames[i]);
			xmlStr += '<group name="' + groupNames[n-i-1] + '" >\r\n';
		}
	} else if (openedGroups.length > 0) {	//remove
		for (var i = 0 ; i < openedGroups.length ; i++) {
			xmlStr += "</group>\r\n";
		}
		openedGroups = [];
	} else if (groupNames.length > 0) {		//add
		for (var i = 0 ; i < groupNames.length ; i ++) {
			xmlStr += '<group name="'+groupNames[groupNames.length-i-1]+'" >\r\n';
			openedGroups[i] = groupNames[i];
		}
	}
}

/* **************************************************************/

function createElement(o) {
	var str = "";
	var getColour = false;

	var name = sub(o.name,1,-1);
	if (name.indexOf("$") > -1) {
		name = name.replace("$","");
		getColour = true;
	}

	var type = sub(name,0,2);
	var fullName = o.parent.name+sub(name,2,-1);
	fullName = fullName.replace("+","");

	var frame = "";
	if (sub(o.name,0,1) == "+") frame = o.parent.name;
	else frame = o.parent.name + sub(o.name,3,-1);
	frame = frame.replace("+","").replace("@","");

	var atlas = sub(docName,0,docName.length-3);

	if (type == "im") {
		str += '<image ';
		str += 'name="' + fullName + '" ';
		str += 'atlas="' + atlas + '.atlas" ';
		str += 'frame="' + frame + '" ';

	} else if (type == "bg") {
		str += '<image ';
		str += 'name="' + fullName + '" ';
		str += 'type="background" ';
		str += 'atlas="' + atlas + '.atlas" ';
		str += 'frame="' + frame + '" ';

	} else if (type == "bt") {
		str += '<button ';
		str += 'name="' + fullName + '" ';
		str += 'atlas="' + atlas + '.atlas" ';
		str += 'frameUp="' + frame + '" ';

		str += getFrame(o, frame, "Down");
		str += getFrame(o, frame, "Checked");
		str += getFrame(o, frame, "Disabled");
	} else if (type == "tf") {
		str += '<textField ';
		str += 'name="' + fullName + '" ';
		str += 'atlas="' + atlas + '.atlas" ';
		str += getCustomFrame(o, frame, "backgroundImage");
		str += getCustomFrame(o, frame, "selectionImage");
		str += getCustomFrame(o, frame, "cursorImage");
		str += getLabel(o);

	} else if (type == "tb") {
		str += '<textButton ';
		str += 'name="' + fullName + '" ';
		str += 'atlas="' + atlas + '.atlas" ';
		str += 'frameUp="' + frame + '" ';

		str += getFrame(o, frame, "Down");
		str += getFrame(o, frame, "Checked");
		str += getFrame(o, frame, "Disabled");
		str += getLabel(o);
		str += getLabelOffset(o);

	} else if (type == "lb") {
		str += '<label ';
		str += 'name="' + fullName + '" ';
		str += getLabel(o);
	} else if (type == "pl") {
		str += '<placeholder ';
		str += 'name="' + fullName + '" ';
	} else if (type == "sl") {
		str += '<slider ';
		str += 'name="' + fullName + '" ';
		str += 'atlas="' + atlas + '.atlas" ';
		str += getFrame(o, frame, "Background");
		str += getFrame(o, frame, "Knob");
	} else if (type == "ca") {
		str += '<card ';
		str += 'name="' + fullName + '" ';
		str += 'atlas="' + atlas + '.atlas" ';
		str += 'frameUp="' + frame + '" ';
		str += 'frameDown="' + frame + '" ';
		str += 'frameDisabled="cards_card_back_pack" ';
	} else {
		alert("Actor type '" + type + "' in '"+o.parent.name+"' is not recognised.");
		return str;
	}

	str += 'x="'+x+'" ';
	str += 'y="'+y+'" ';
	str += 'width="'+w+'" ';
	str += 'height="'+h+'" ';

	if (getColour) str += 'color="' + RGBtoHex(o.fillColor) + '" ';

	str = str + "/>\r\n";

	return str;
}

/***************************************************************/

function getLabel(o) {
	var str = "";

	if (o.typename == "TextFrame") {
		str += 'text="' + o.contents + '" ';
		str += 'fontColor="' + RGBtoHex(o.textRange.characterAttributes.fillColor) + '" ';
		str += 'fontSize="' + o.textRange.characterAttributes.size + '" ';
		str += 'fontName="' + o.textRange.characterAttributes.textFont.name + '" ';
		return str;
	}

	for (var i = 0; i < o.parent.pageItems.length ; i++) {
		if (o.parent.pageItems[i].name.indexOf("label") > -1) {
			str += 'text="' + o.parent.pageItems[i].contents + '" ';
			str += 'fontColor="' + RGBtoHex(o.parent.pageItems[i].textRange.characterAttributes.fillColor) + '" ';
			str += 'fontSize="' + o.parent.pageItems[i].textRange.characterAttributes.size + '" ';
			str += 'fontName="' + o.parent.pageItems[i].textRange.characterAttributes.textFont.name + '" ';
			break;
		}
	}
	return str;
}

function getLabelOffset(o) {
	var str = "";
	var offset = 0;
	var labelY = 0;
	var labelH = 0;

	for (var i = 0; i < o.parent.pageItems.length ; i++) {
		if (o.parent.pageItems[i].name.indexOf("label") > -1) {
			labelY = o.parent.pageItems[i].visibleBounds[3] + artboardH;
			labelH = o.parent.pageItems[i].visibleBounds[1] + artboardH - labelY;

			offset = (labelY + labelH/2.0 - y - h/2.0) * 2.0;
			if (offset > 0) str += 'labelPaddingBottom="' + offset + '" ';
			else if (offset < 0) str += 'labelPaddingTop="' + (-offset) + '" ';
			break;
		}
	}
	return str;
}

function getFrame(o, frame, variant) {
	var str = 'frame' + variant + '="' + frame + '" ';

	for (var i = 0; i < o.parent.pageItems.length ; i++) {
		if (o.parent.pageItems[i].name.indexOf(variant) > -1) {
			str = 'frame' + variant + '="' + frame + '_' + variant + '" ';
			break;
		}
	}
	return str;
}

function getCustomFrame(o, frame, variant) {
	var str = "";
	for (var i = 0; i < o.parent.pageItems.length ; i++) {
		if (o.parent.pageItems[i].name.indexOf(variant) > -1) {
			str = variant + '="' + frame + '_' + variant + '" ';
			break;
		}
	}
	return str;
}

/***************************************************************/

function getPNGName(o) {
	if (sub(o.parent.name,0,1) == "+") return sub(o.parent.name,1,-1) + sub(o.name,3,-1);
	else return o.parent.name + sub(o.name,3,-1);
}

// Save PNG file
function savePNG(file, scale, artBoardClipping) {

	var exp = new ExportOptionsPNG24();
	exp.transparency = true;
	exp.horizontalScale = scale
	exp.verticalScale = scale;
	exp.artBoardClipping = artBoardClipping;

	doc.exportFile(file, ExportType.PNG24, exp);
}

function saveXML(Path, txt)
{
	var saveFile = File(Path);
	if(saveFile.exists) saveFile.remove();

	saveFile.encoding = "UTF8";
	saveFile.open("e", "TEXT", "????");
	saveFile.writeln(txt);
	saveFile.close();
}

/***************************************************************/

function showUnrelated() {
	for (var i = 0 ; i < hiddenForNow.length ; i++)
		hiddenForNow[i].hidden = false;
	hiddenForNow = [];
}

function hideUnrelated(o, objs) {
	for (var i = 0 ; i < objs.length ; i++) {
		if (objs[i].locked) objs[i].locked = false;
		if (objs[i].hidden) continue;
		if (!isParent(o, objs[i]) && !isParent(objs[i],o)) {
			hiddenForNow[hiddenForNow.length] = objs[i];
			objs[i].hidden = true;
		}
	}
}

function isParent(parent, child) {
	var parentName = parent.parent.name+sub(parent.name,2,-1);
	if (child == null || child.parent == null || typeof child == 'undefined' || typeof child.parent == 'undefined') return false;
	var childName = child.parent.name+sub(child.name,2,-1);
	if (childName == parentName) return true;
	return isParent(parent,child.parent);
}

function sub(name,start,end) {
	if (start >= name.length) return "";
	if (end == -1) end = name.length;
	return name.substring(start,end);
}

function exportLayout(name){
	if (sub(name,0,1) == EXPORT_LAYOUT || sub(name,0,1) == EXPORT_BOTH) return true;
	return false;
}

function exportPng(name){
	if (sub(name,0,1) == EXPORT_PNG || sub(name,0,1) == EXPORT_BOTH) return true;
	return false;
}

/******************************************************************************/

function RGBtoHex(c) {
	var str = "";
	var red, green, blue;
	if (typeof c.red == 'undefined') {
		red = Math.round(c.gray * 2.55);
		green = Math.round(c.gray * 2.55);
		blue = Math.round(c.gray * 2.55);
	} else {
		red = c.red;
		green = c.green;
		blue = c.blue;
	}

    var decColor = (blue) + (256 * green) + (65536 * red);
    var hexColor=decColor.toString(16);
	while(hexColor.length < 6) hexColor = "0" + hexColor;

	if (hexColor.toUpperCase() == "000NAN") alert("r= " + red + ", g= " + green + ", b= " + blue);
	return hexColor.toUpperCase();
}