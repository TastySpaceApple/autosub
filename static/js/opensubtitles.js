var OpenSubtitles = function(userAgent){
  this.userAgent = userAgent || 'Popcorn Time v1';
  this.xmlrpc_token = null;
}
  
/**
 * Login to open subtitles
 * @param {String}          username - username to an opensubtitles account
 * @param {String}          password - password to opensubtitles account
 */
OpenSubtitles.prototype.login = function(username, pass){
  var loginRequest= new XmlRpcRequest("http://api.opensubtitles.org/xml-rpc", "LogIn");
  loginRequest.params = ([username || '', pass || '', 'eng', this.userAgent]);
  var response1 = loginRequest.send();
  this.xmlrpc_token = String(response1.parseXML().token);
}
  
/**
 * Search for subtitles
 * @param {Object}          info - information about the video to be subtitled
 *
 * @param {String}|{Array}  info.extensions - Accepted extensions, defaults to 'srt' (values: srt, sub, smi, txt, ssa, ass, mpl)
 * @param {String}|{Array}  info.sublanguageid - Desired subtitle lang, ISO639-3 langcode, defaults to 'all'
 * @param {String}          info.hash - Size + 64bit checksum of the first and last 64k
 * @param {File}            info.file - the video file, it allows to automatically calculate 'hash'
 * @param {String}|{Int}    info.filesize - Total size, in bytes
 * @param {String}          info.filename - The video file name. Better if extension is included
 * @param {String}|{Int}    info.season - If TV Episode
 * @param {String}|{Int}    info.episode - If TV Episode
 * @param {String}|{Int}    info.imdbid - IMDB id with or without leading 'tt'
 * @param {String}|{Int}    info.fps - Number of frames per sec in the video
 * @param {String}          info.query - Text-based query, this is not recommended
 * @param {String}|{Int}    info.limit - Number of subtitles to return for each language, can be 'best', 'all' or an arbitrary number. Defaults to 'best'
 
 * @param {Function}        callback - the return function
 */
OpenSubtitles.prototype.search = function(info, callback){
  if(this.xmlrpc_token == null){
    console.warn('Trying to search on opensubtitles before logging in. Attempting to log in with default paramters');
    this.login();
  }
  if(info.file && !info.hash){
    var self = this;
    self.hash(info.file, function(file, checksum){
      delete info.file;
      console.log(checksum);
      info.moviehash = checksum;
      self.search(info, callback); //{query: file.name, sublanguageid:"eng", limit:10}
    })
    return;
  }
  if(!info.limit)
    info.limit = 10;
  var searchRequest = new XmlRpcRequest("http://api.opensubtitles.org/xml-rpc", "SearchSubtitles");
  searchRequest.addParam(this.xmlrpc_token);
  searchRequest.addParam([info]);
  searchRequest.addParam({'limit':1});
  var results = searchRequest.send().parseXML();
  this.xmlrpc_token = results.token; 
  console.log(results.data.length);
  callback(results.data);// SubDownloadLink
}
  
/**
 * Read subtitles from opensubtitles url
 * @param {String}          url - OS url to read from
 * @param {Function}        callback - the return function, first arguemnt is string for srt text
 */
OpenSubtitles.prototype.readSub = function(url, callback){
  var xhr = new XMLHttpRequest();
  //http://dl.opensubtitles.org/en/download/src-api/vrf-19bc0c55/sid-r7sf9jfdrjl2avcjnlhlkd0r76/filead/1955239181.gz
  xhr.open('GET', url, true);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(e) {
     if (this.status == 200) {
       var uInt8Array = new Uint8Array(this.response); // Note:not xhr.responseText
       var data        = pako.inflate(this.response);
       var strData     = String.fromCharCode.apply(null, new Uint16Array(data));
       callback(strData);
     } else
       callback(null);
  }
  xhr.send(null);
}
/**
 * Read subtitles from opensubtitles url
 * @param {File}            file - File to create hash for
 * @param {Function}        callback - the return function, first arguemnt is the input file, second is the computed hash
 */
OpenSubtitles.prototype.hash = function(file, callback) {
    var HASH_CHUNK_SIZE = 65536, //64 * 1024
        longs = [],
        temp = file.size;

    function read(start, end, callback) {
        var reader = new FileReader();
        reader.onload = function(e) {
            callback.call(reader, process(e.target.result));
        };

        if (end === undefined) {
            reader.readAsBinaryString(file.slice(start));
        } else {
            reader.readAsBinaryString(file.slice(start, end));
        }
    }

    function process(chunk) {
        for (var i = 0; i < chunk.length; i++) {
            longs[(i + 8) % 8] += chunk.charCodeAt(i);
        }
    }

    function binl2hex(a) {
        var b = 255,
            d = '0123456789abcdef',
            e = '',
            c = 7;

        a[1] += a[0] >> 8;
        a[0] = a[0] & b;
        a[2] += a[1] >> 8;
        a[1] = a[1] & b;
        a[3] += a[2] >> 8;
        a[2] = a[2] & b;
        a[4] += a[3] >> 8;
        a[3] = a[3] & b;
        a[5] += a[4] >> 8;
        a[4] = a[4] & b;
        a[6] += a[5] >> 8;
        a[5] = a[5] & b;
        a[7] += a[6] >> 8;
        a[6] = a[6] & b;
        a[7] = a[7] & b;
        for (d, e, c; c > -1; c--) {
            e += d.charAt(a[c] >> 4 & 15) + d.charAt(a[c] & 15);
        }
        return e;
    }


    for (var i = 0; i < 8; i++) {
        longs[i] = temp & 255;
        temp = temp >> 8;
    }

    read(0, HASH_CHUNK_SIZE, function() {
        read(file.size - HASH_CHUNK_SIZE, undefined, function() {
            callback.call(null, file, binl2hex(longs));
        });
    });
}