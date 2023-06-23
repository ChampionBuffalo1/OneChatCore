// @ts-nocheck
const WebSocket = require('ws');

const fetch = (/** @type {string} */ s, /** @type {{ method: string; body: string; }} */ b) =>
  /** @type {Promise<{
    from: string;
    to: string;
    content: string;
    image: string[];
    timestamp: number;
}>} */ (
    new Promise(res =>
      setTimeout(() => {
        console.debug(s, b);
        res();
      }, 1000)
    )
  );

const socket = new WebSocket('ws://localhost:3001/ws');
const messages = [
  {
    from: 'Hackerman',
    to: 'user-22',
    content: 'heheheh',
    image: [],
    timestamp: 1221
  },
  {
    from: 'Hackerman',
    to: 'groupId',
    content: 'he did that, yeah',
    image: ['https://google.com'],
    timestamp: 122222
  }
];

socket.addEventListener('open', event => {
  console.log('Connected to the WebSocket server');

});

socket.addEventListener('message', event => {
  const json = JSON.parse(event.data.toString());
  console.log(`Received message: ${JSON.stringify(json)}`);
  if (json.time) {
    socket.send(JSON.stringify(sendMetaInfo()));
  }
  if(json.data) {
    socket.send(JSON.stringify({ text: 'hello', sender: {
      id: "myidisnigger",
      username: "nigger"
    } }));
  }
});

socket.addEventListener('close', event => {
  console.log('Disconnected from the WebSocket server', event.reason);
});

function sendMetaInfo() {
  return {
    os: 'linux',
    'user-agent': 'FireFox',
    token:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXkiOiJmMmRiZGVhYy0xYzljLTQ4ZjctYSIsImRhdGEiOnsidXNlcklkIjoiNjQ1MjY2MTc4YTNmN2UyYjQzOGFjODlkIn0sImlhdCI6MTY4MzQ3Njc4MiwiZXhwIjoyMjg4Mjc2NzgyfQ.jElI4Dafwx2N7tj0RjHnEUaLTWJKBLXNdJcYvUpUmHw',
    chatfunctions: {
      compression: 'false'
    }
  };
}

// sendMessage('This is a new message').then(r => messages.push(r));

/**
 * @param {string} content
 */
async function sendMessage(content) {
  return fetch('http://localhost:3000/api/message', {
    method: 'POST',
    body: JSON.stringify({
      content
    })
  });
}

/* {
  op: 2,
  d: {
    token: 'Mzc4OTI3NjQxMzkyMTg1MzQ1.Gv6HSc._ZQ9KN8tBV_WdXNV3kFpw1SvJNF3HXe31DtL5E',
    capabilities: 8189,
    properties: {
      os: 'Linux',
      browser: 'Firefox',
      device: '',
      system_locale: 'en-US',
      browser_user_agent: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/111.0',
      browser_version: '111.0',
      os_version: '',
      referrer: '',
      referring_domain: '',
      referrer_current: '',
      referring_domain_current: '',
      release_channel: 'stable',
      client_build_number: 188808,
      client_event_source: null
    },
    compress: false,
    // Reconnection thing
    client_state: {
      guild_versions: {},
      highest_last_message_id: '0',
      read_state_version: 0,
      user_guild_settings_version: -1,
      user_settings_version: -1,
      private_channels_version: '0',
      api_code_version: 0
    }
  }
};
*/
