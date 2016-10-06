var subber = new OpenSubtitles();
var zip = new JSZip();
zip.file("Downloaded using autosub.txt", "Downloaded from autosub - automatic subtitles searcher");
var files = [];
var filesElements = [];
var filesContainer = document.getElementById('files-display');
var processingFileIndex=0;

function processFiles(mfiles){  
  for(var i=0; i<mfiles.length; i++){
    files.push(mfiles[i]);
    var el = document.createElement("li");
    el.className = "waiting";
    el.textContent = mfiles[i].name;
    filesContainer.appendChild(el);
    filesElements.push(el);
  }
  document.getElementById('btnDownload').setAttribute('disabled', 'disabled');
  setTimeout(processNext, 500);
}

function processNext(){
  if(processingFileIndex == files.length)
    document.getElementById('btnDownload').removeAttribute('disabled');
  else
    processFile(files[processingFileIndex], function(success){
      filesElements[processingFileIndex].className = success ? "completed" : "error";
      processingFileIndex++;
      setTimeout(processNext, 500);
    })
}

function processFile(file, next) {
    //setTimeout(next, 2000);
    //return;
    console.log("Processing " + file.name);
    var language = document.getElementById('SubLanguageID').value;
    subber.search({file:file, sublanguageid:language}, function(results){
      if(results.length < 1){
        next(false);
        return;
      }
      console.log("sub found: "+ results[0].SubDownloadLink)
      subber.readSub(results[0].SubDownloadLink, function(text){
        addToZip(file.name.replace(/\.[^/.]+$/, "") + '.srt', text);
        next(true);
      });
    });
}

function addToZip(filename, text){
  zip.file(filename, text);
}

function download(){
  zip.generateAsync({type:"blob"})
    .then(function (blob) {
        saveAs(blob, "subtitles.zip");
  });
}


document.getElementById('fileinput').addEventListener('change', function(ev){
  processFiles(this.files);
}, false);

document.getElementById('filedropzone').addEventListener('ondrop', function(event){
  event.stopPropagation(); event.preventDefault();
  processFiles(event.dataTransfer.files);
}, false);

document.getElementById('SubLanguageID').addEventListener('change', function(){
  localStorage['SubLanguageID'] = this.value;
});
if(localStorage['SubLanguageID'] != null)
  document.getElementById('SubLanguageID').value = localStorage['SubLanguageID'];

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs=saveAs||function(e){"use strict";if(typeof e==="undefined"||typeof navigator!=="undefined"&&/MSIE [1-9]\./.test(navigator.userAgent)){return}var t=e.document,n=function(){return e.URL||e.webkitURL||e},r=t.createElementNS("http://www.w3.org/1999/xhtml","a"),o="download"in r,i=function(e){var t=new MouseEvent("click");e.dispatchEvent(t)},a=/constructor/i.test(e.HTMLElement),f=/CriOS\/[\d]+/.test(navigator.userAgent),u=function(t){(e.setImmediate||e.setTimeout)(function(){throw t},0)},d="application/octet-stream",s=1e3*40,c=function(e){var t=function(){if(typeof e==="string"){n().revokeObjectURL(e)}else{e.remove()}};setTimeout(t,s)},l=function(e,t,n){t=[].concat(t);var r=t.length;while(r--){var o=e["on"+t[r]];if(typeof o==="function"){try{o.call(e,n||e)}catch(i){u(i)}}}},p=function(e){if(/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)){return new Blob([String.fromCharCode(65279),e],{type:e.type})}return e},v=function(t,u,s){if(!s){t=p(t)}var v=this,w=t.type,m=w===d,y,h=function(){l(v,"writestart progress write writeend".split(" "))},S=function(){if((f||m&&a)&&e.FileReader){var r=new FileReader;r.onloadend=function(){var t=f?r.result:r.result.replace(/^data:[^;]*;/,"data:attachment/file;");var n=e.open(t,"_blank");if(!n)e.location.href=t;t=undefined;v.readyState=v.DONE;h()};r.readAsDataURL(t);v.readyState=v.INIT;return}if(!y){y=n().createObjectURL(t)}if(m){e.location.href=y}else{var o=e.open(y,"_blank");if(!o){e.location.href=y}}v.readyState=v.DONE;h();c(y)};v.readyState=v.INIT;if(o){y=n().createObjectURL(t);setTimeout(function(){r.href=y;r.download=u;i(r);h();c(y);v.readyState=v.DONE});return}S()},w=v.prototype,m=function(e,t,n){return new v(e,t||e.name||"download",n)};if(typeof navigator!=="undefined"&&navigator.msSaveOrOpenBlob){return function(e,t,n){t=t||e.name||"download";if(!n){e=p(e)}return navigator.msSaveOrOpenBlob(e,t)}}w.abort=function(){};w.readyState=w.INIT=0;w.WRITING=1;w.DONE=2;w.error=w.onwritestart=w.onprogress=w.onwrite=w.onabort=w.onerror=w.onwriteend=null;return m}(typeof self!=="undefined"&&self||typeof window!=="undefined"&&window||this.content);if(typeof module!=="undefined"&&module.exports){module.exports.saveAs=saveAs}else if(typeof define!=="undefined"&&define!==null&&define.amd!==null){define([],function(){return saveAs})}