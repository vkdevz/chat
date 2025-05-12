const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 5002;

app.use(cors());
app.use(bodyParser.json());

// Load chatbot responses from JSON file
const responses = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'chatbot_responses.json'), 'utf8'));

// Function to get a random response from an array
function getRandomResponse(responses) {
  return responses[Math.floor(Math.random() * responses.length)];
}

// Function to normalize text for comparison
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

// Function to check if a message contains any of the keywords
function findMatchingKeywords(message, keywords) {
  const normalizedMessage = normalizeText(message);
  const normalizedKeywords = keywords.map(keyword => normalizeText(keyword));
  
  // Check for exact matches first
  for (const keyword of normalizedKeywords) {
    if (normalizedMessage === keyword) {
      return true;
    }
  }
  
  // Check for partial matches
  for (const keyword of normalizedKeywords) {
    // Split both message and keyword into words
    const messageWords = normalizedMessage.split(' ');
    const keywordWords = keyword.split(' ');
    
    // Check if all words in the keyword are present in the message
    const allWordsMatch = keywordWords.every(word => 
      messageWords.some(msgWord => msgWord.includes(word) || word.includes(msgWord))
    );
    
    if (allWordsMatch) {
      return true;
    }
  }
  
  return false;
}

// Function to find the best matching response
function getBotResponse(message) {
  const lowerMessage = normalizeText(message);
  
  // Check each category
  for (const category in responses) {
    if (category === 'default') continue;
    
    // Get all keywords for this category
    const keywords = Object.keys(responses[category]);
    
    // Check if message matches any keyword in this category
    if (findMatchingKeywords(message, keywords)) {
      // Get all possible responses for this category
      const categoryResponses = keywords.reduce((acc, keyword) => {
        return acc.concat(responses[category][keyword]);
      }, []);
      
      return getRandomResponse(categoryResponses);
    }
  }
  
  // If no match found, return a random default response
  return getRandomResponse(responses.default.unknown);
}

app.post('/api/chat', (req, res) => {
  console.log('Chat endpoint hit with body:', req.body);
  const { message } = req.body;
  const response = getBotResponse(message);
  console.log('Sending response:', response);
  res.json({ response });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 