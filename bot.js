require('dotenv').config();
console.log("Mastodon bot starting...");
const Tusk = require('tusk-mastodon');
const fs = require('fs'),
      es = require('event-stream'),
      path1 = 'memeNumberTEMP.txt',
      path2 = 'NWHouNAMeetupMemesTEMP.txt',
      path3 = 'totalMemesNumberTEMP.txt';
var memeToPost = "",

    memeNumber = 0,
    memeNumData = [],
    currentMemeNumStr = "",
    //in case we fail to post, store the old num
    oldMemeNumStr = ""
    i_as_string = "",
    
    totalMemeNum = 0,
    totalMemeNumData = [],
    totalMemeStr = "";    

try {
    memeNumData = fs.readFileSync(path1);
    totalMemeNumData = fs.readFileSync(path3);
} catch (error) {
    console.log("a READ error occurred, errno=" + error.errno + "\n")
    console.log(error)
    process.exit(error.errno);    
}

if (memeNumData.length != 0) {
    memeNumData.forEach(i => {
        currentMemeNumStr += String.fromCharCode(i);
        oldMemeNumStr = currentMemeNumStr
    });
} else {
    console.log('memeNumData was empty');
    console.log('make sure bot-daemon.js has read access')
    process.exit(1);
}
console.log("meme number is: " + memeNumData);
// the actual meme read will be memeNumber + 1
memeNumber = parseInt(currentMemeNumStr);


if (totalMemeNumData.length != 0) {
    totalMemeNumData.forEach(i => {
        totalMemeStr += String.fromCharCode(i);
    });  
} else {
    console.log('totalMemeNumData was empty');
    console.log('make sure bot-daemon.js has read access');
    process.exit(1);
}

console.log("total memes number is: " + totalMemeNumData);
totalMemeNum = parseInt(totalMemeStr);

if (memeNumber == totalMemeNum) {
    memeNumber = 0;
    console.log('memeNumber reset to zero since reached EOF')
}

const NAS = new Tusk({
    client_key: process.env.NAU_CLIENT_KEY,
    client_secret: process.env.NAU_CLIENT_SECRET,
    access_token: process.env.NAU_AUTH_TOKEN,
    timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
    api_url: 'https://noauthority.social/api/v1/', // optional, defaults to https://mastodon.social/api/v1/n
})



var i = 0;

var s = fs.createReadStream(path2)
    .pipe(es.split())
    .pipe(es.mapSync(function(meme) {
                // pause the readstream
                s.pause();
                
                // the stream reads past the end of the file, causing a blank meme to be read
                // so to keep the total to not be counted one above the actual total,
                // only increment if not blank
                if (meme != '') {
                    i++;
                }

                if (i > memeNumber && i_as_string == "") {
                    console.log('memeToPost = ' + meme);
                    memeToPost = meme;                   
                    i_as_string = i.toString();
                } 

                s.resume();                
        })
        .on('error', function(err) {
            console.log('Error occurred, errno=:' + err.errno + '\n', err);
            process.exit(err.errno)
        })
        .on('end', function(){
            console.log('Finished Reading');
            totalMemeStr = i.toString();
            currentMemeNumStr = i_as_string;
            // finally, toot the new meme
            toot(memeToPost);
        })
    );




function toot(newMeme) {
    const params = {
        status: "NW Houston NA Meetup #8: ⬇️\n\n"
        + newMeme + "\n\n" +
        "⬇️ \n\n"
        + "" +
        "\n\n" + "#" + "\n\n\n\n" +
        "",
        visibility: "direct"
    }

    //DEBUG testing Promises instead of callback
    // seems to work but Uncaught Error: getaddrinfo ENOTFOUND
    // is a bug in the mastodon-api library I'm using
    // https://stackoverflow.com/questions/64283656/nodejs-getaddrinfo-enotfound-uncaught
    NAS.post('statuses', params)
        .then( function (promiseObject) {
            console.log('success! :)')
            data = promiseObject.data
            resp = promiseObject.resp
            rspCode = resp.status
            instanceURL = NAS.apiUrl
            switch (true) {
                case (rspCode > 199 && rspCode < 300):
                    //SUCCESS
                    console.log(`here is the toot on ${instanceURL}:`) 
                    console.log(`ID: ${data.id} and timestamp: ${data.created_at}`);
                    // update memeNum after posting to Mastodon
                    console.log("incrementing memeNumber")            
                    updateMemeNum(currentMemeNumStr)
                    break
                default:
                    console.log("request failed, response.statusCode= " + rspCode + " " + resp.statusText)
                    console.log(data.error + "\n======================")
                    console.log("memeNumber not changed:" + oldMemeNumStr)
                    process.exit(1)
            }
        })
        .catch( function (err) {
            console.log("T.post failed, error = " )
            console.log(err.message + "\n=======================")
            console.log(err.stack)
            console.log("memeNumber not changed:" + oldMemeNumStr)
            process.exit(1)
        })
}

function mastodonCallback(post_err, data, response, instanceURL) {
    if (post_err) {
        console.log("an error when tooting, errno=" + post_err.errno)            
        console.log("post_err is\n" + post_err)
        console.log("data.error is\n" + data.error)
        console.log("memeNumber not changed:" + oldMemeNumStr)
        process.exit(1)
    } else if (data.length < 1) {
        console.log("no data")
        console.log("memeNumber not changed:" + oldMemeNumStr)
        process.exit(1)
    } else {
        rspCode = response.statusCode
        switch (true) {
            case (rspCode >= 200 && rspCode < 300):
                //SUCCESS
                console.log(`here is the toot on ${instanceURL}:`) 
                console.log(`ID: ${data.id} and timestamp: ${data.created_at}`);  
                // update memeNum after successful post
                console.log("incrementing memeNumber")
                updateMemeNum(currentMemeNumStr)       
                break   
            default:
                console.log("request failed, response.statusCode= " + rspCode)
                console.log("post_err is\n " + post_err)
                console.log("data.error is\n" + data.error)
                console.log("memeNumber not changed:" + oldMemeNumStr)
                process.exit(1)
        }
    }
}
function updateMemeNum(currentMemeNumStr) {
    try {
        fs.writeFileSync(path1, currentMemeNumStr);
        console.log('memeNumber changed to ' + currentMemeNumStr); 
        fs.writeFileSync(path3, totalMemeStr);
        console.log('total memes = ' + totalMemeStr);
    } catch(error) {
        console.log("a WRITE error occurred, errno=" + error.errno + "\n")
        console.log(error)
        process.exit(1)
    }
}