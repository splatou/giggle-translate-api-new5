// testLiveLimiter.js
const axios = require('axios');

async function testLiveLimiter() {
  // Update the endpoint if needed; ensure that this route exists on your live API.
  const url = 'https://giggle-translate-api.onrender.com/api/explain';

  // We'll try to make 35 requests, which should exceed the limit (30 requests per 15 minutes)
  for (let i = 1; i <= 100; i++) {
    try {
      // Use POST with a sample payload that matches what your endpoint expects.
      const response = await axios.post(url, {
        word: "test",    // example word
        age: 3,          // example age
        language: "English" // example language; adjust as necessary
      });
      console.log(`Request ${i}: ${response.status} - ${JSON.stringify(response.data)}`);
    } catch (err) {
      if (err.response) {
        console.log(`Request ${i}: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      } else {
        console.log(`Request ${i}: Error - ${err.message}`);
      }
    }
  }
}

testLiveLimiter();