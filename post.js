const request = require('request');
var rp = require('request-promise');
require('dotenv').config();


const set_uri = (coin) =>{
    let url = '';
    switch (coin){
      case 'LTC':
        url = 'http://'+ process.env.NODE_USER_LTC + ':' + process.env.NODE_PWD_LTC + '@127.0.0.1:9332';
        break;
      case 'BTC':
        url = 'http://'+ process.env.NODE_USER_BTC + ':' + process.env.NODE_PWD_BTC + '@127.0.0.1:8332';
        break;
      default:
        console.log('a proper Ticker is required for POST to work');
    }
    return url;
}


async function postRequest(json_req,coin){
  const uri = set_uri(coin);
  var options = {
      method: 'POST',
      uri: uri,
      body: json_req,
      json: true // Automatically stringifies the body to JSON
  }

  const body  = await rp(options)
  return body
}

module.exports = postRequest
