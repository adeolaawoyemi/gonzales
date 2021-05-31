const fetch = require('node-fetch');
require('dotenv').config();

const insightsAPIUrl = process.env.INSIGHTS_API_URL;
const googleSheetsAPIUrl = process.env.GOOGLE_SHEETS_API_URL;
const testPageUrl = process.env.TEST_PAGE_URL;
const testPageUrl2 = process.env.TEST_PAGE_URL2;
const APIKey = process.env.API_KEY;
const playerUrlRegexp = /https\:\/\/yep\.video\.yahoo\.com\/oath\/js\/1\/oath\-player(-debug)?\.js/;

const { log, error } = console;
let sourceData;

function getFetchTime(source) {
  return source.lighthouseResult.fetchTime;
}

function getPayloadSize(source) {
  const payloadObject = source.lighthouseResult.audits['total-byte-weight'].details.items.filter(item => playerUrlRegexp.test(item.url));
  return payloadObject[0].totalBytes;
}

function getThreadTime(source) {
  const longTasksObject = source.lighthouseResult.audits['long-tasks'].details.items.filter(item => playerUrlRegexp.test(item.url));
  return longTasksObject[0].duration;
}

function getExecutionTime(source) {
  const bootupTimeObject = source.lighthouseResult.audits['bootup-time'].details.items.filter(item => playerUrlRegexp.test(item.url));
  return bootupTimeObject[0].total;
}

function storeData(data) {
  fetch(googleSheetsAPIUrl, {
    method: 'post',
    mode: 'no-cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    body: JSON.stringify(data)
  })
    .then(res => log({statusCode: res.status, statusText: res.statusText}))
    .catch(err => error('storeData error:', err));
}

fetch(`${insightsAPIUrl}${encodeURIComponent(testPageUrl2)}&key=${APIKey}`)
  .then(res => res.json())
  .then(json => {
    sourceData = json;
    // log(JSON.stringify(json, null, 4));
    const fetchTime = getFetchTime(sourceData);
    const payloadSize = getPayloadSize(sourceData);
    const threadTime = getThreadTime(sourceData);
    const executionTime = getExecutionTime(sourceData);
    log({fetchTime, payloadSize, threadTime, executionTime});
    storeData({fetchTime, payloadSize, threadTime, executionTime});
  });

