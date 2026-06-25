const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://192.168.29.132:8000/api/notifications', {
      headers: {
        'Authorization': 'Bearer 12|wiWioQCTsT5Wh6ACDtaFxOHYqemSITdbWFwqQsvra147b944',
        'Accept': 'application/json'
      }
    });
    console.log("Is Array?", Array.isArray(res.data));
    console.log("Length:", res.data.length);
    if (res.data.length > 0) {
      console.log("First item data.title:", res.data[0].data.title);
    }
  } catch (e) {
    console.error(e.message);
  }
}
test();
