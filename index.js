//import {format, compareAsc} from 'date-fns/esm'
const Twitter = require('twitter');
const https = require('https');
const fs = require('fs-extra');
const date = require('date-fns');
const EventEmitter = require('events').EventEmitter;

const ConfigFile = require('config');

const client = new Twitter(ConfigFile.twitter);
const ev = new EventEmitter;
ev.on('connect',() => {
    console.log(new Date(),'connected.');
    client.stream('user', function(stream) {
        stream.on('favorite', function(event) {
            client.get('statuses/show/'+event.target_object.id_str, function(error, tweets, response) {
                if(!tweets){
                    return;
                }
                if(!!tweets.extended_entities){
                    //メディアの処理
                    tweets.extended_entities.media.forEach((media) => {
                        downloadFile(media);
                        console.log(new Date(),'save image. tweetid:'+tweets.id_str);
                    });
                }else if(!!tweets.entities.media){
                    //メディアの処理
                    downloadFile(tweets.entities.media);
                    console.log(new Date(),'save image. tweetid:'+tweets.id_str);                    
                };
            });
        });
        stream.on('error', function(error) {
            console.warn(new Date(),'cought error ;_;')
            console.error(error);
            setTimeout(function () {
                ev.emit('connect');
            }, 30*1000);
        });
    });    
});
ev.emit('connect');

function downloadFile(media){
    const url = media.media_url_https;
    const s = /(.+)(\.[^.]+$)/.exec(url);
    const outFile = fs.createWriteStream(ConfigFile.outputfolder + media.id+s[2]);
    var req = https.get(url, function (res) {
        res.pipe(outFile);
        res.on('end', function () {
            outFile.close();
            
        }); 
    });
}
