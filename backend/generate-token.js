import jwt from 'jsonwebtoken';


// Function to generate a test token
function generateTestToken() {
  const payload = {
    id: '1a',
    // email: 'test@example.com',
    // phone_number: '1234567890',
    // role: 'user'
    // Add any other claims you need in your token
  };

  // Replace 'your_secret_key' with your actual JWT_SECRET value
  // or use process.env.JWT_SECRET if you have it in your environment variables
  const secret = process.env.JWT_SECRET || "SharyoNewBackendToken"
  
  // You can specify token expiration (e.g., '1h' for one hour)
  const token = jwt.sign(payload, secret, { expiresIn: '24h' });
  
  console.log('Generated test token:');
  console.log(token);
  
  return token;
}

// Generate and log a token
const testToken = generateTestToken();

// How to use the token in your requests
console.log('\nUse this token in your Authorization header:');
console.log(`Authorization: ${testToken}`);