const Twitter = require('twitter');
const https = require('https');
const fs = require('fs');
const ConfigFile = require('config');

const client = new Twitter(ConfigFile.twitter);
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
                    console.log('save images. tweetid:'+tweets.id_str);
                });

            }else if(!!tweets.entities.media){
                //メディアの処理
                downloadFile(tweets.entities.media);
                console.log('save image. tweetid:'+tweets.id_str);
            };
        });
    });
    stream.on('error', function(error) {
      throw error;
    });
});

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
