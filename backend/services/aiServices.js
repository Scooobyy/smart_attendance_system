const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function getFaceEncoding(imagePath) {
    const formData = new FormData();
    formData.append('image', fs.createReadStream(imagePath));

    const res = await axios.post('http://127.0.0.1:5001/encode-face', formData, {
        headers: formData.getHeaders()
    });

    return res.data.encoding;
}

module.exports = { getFaceEncoding };
