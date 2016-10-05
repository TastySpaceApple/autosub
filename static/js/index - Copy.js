var userAgent = 'Popcorn Time v1';


function searchSubs(info){    
  var loginRequest= new XmlRpcRequest("http://api.opensubtitles.org/xml-rpc", "LogIn");
  loginRequest.params = (['', '', 'eng', userAgent]);
  var response1= loginRequest.send();
  var token=String(response1.parseXML().token);
  console.log(token);

  var searchRequest = new XmlRpcRequest("http://api.opensubtitles.org/xml-rpc", "SearchSubtitles");
  searchRequest.addParam(token);
  searchRequest.addParam([info]);
  var results = searchRequest.send().parseXML();
  for(var i=0; i < results.data.length; i++){
      console.log(results.data[i].SubDownloadLink + "");
  }
}

function readSingleFile(evt) {
    //Retrieve the first (and only!) File from the FileList object
    var f = evt.target.files[0]; 
    hash(f, function(file, checksum){
      console.log(file);
      searchSubs({query: file.name, sublanguageid:"eng", limit:10});
    });
}

document.getElementById('fileinput').addEventListener('change', readSingleFile, false);
