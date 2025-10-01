const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function getFaceEncoding(imagePath) {
    try {
        console.log('Getting face encoding for image:', imagePath);

        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error('Image file does not exist: ' + imagePath);
        }

        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));

        const response = await axios.post('http://127.0.0.1:5001/encode-face', formData, {
            headers: formData.getHeaders(),
            timeout: 30000
        });

        console.log('AI Service response received');
        
        if (!response.data.success) {
            throw new Error('AI service error: ' + (response.data.message || 'Unknown error'));
        }

        if (!response.data.encoding) {
            throw new Error('No encoding received from AI service');
        }

        console.log('Face encoding successfully received');
        return response.data.encoding;

    } catch (error) {
        console.error('Error in getFaceEncoding:', error.message);
        
        if (error.response) {
            console.error('AI Service error response:', error.response.data);
        } else if (error.request) {
            console.error('No response from AI service - is it running on port 5001?');
        }
        
        throw new Error(`Face encoding failed: ${error.message}`);
    }
}

module.exports = { getFaceEncoding };