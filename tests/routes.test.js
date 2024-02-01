const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const User = require('../models/User');
const ActionToken = require('../models/ActionToken');
const ShortUrl = require('../models/ShortUrl');
const app = require('./testEnvironment'); 

// Create a new instance of the in-memory Mongo server
const mongoServer = new MongoMemoryServer();

beforeAll(async () => {
    await mongoServer.start();

    // Wait for a short delay to ensure the server is running
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Get the connection string of the in-memory database
    const mongoUri = mongoServer.getUri();

    // Check if mongoose is already connected
    if (mongoose.connection.readyState === 0) {
        // Connect to the in-memory database
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
    }
});

afterAll(async () => {
    // Disconnect Mongoose and stop the in-memory database
    await mongoose.disconnect();
    await mongoServer.stop();
});

let localUserId = null;
let localActionTokenId = null;
let localShortUrlId = null;
let cookies = null;

describe('Check health', () => {
  it('(HEALTH): I am very healthy ', async () => {
    const response = await request(app)
      .get('/health')
      
    expect(response.status).toBe(200);
  });
});

describe('Register new user', () => {
  it('(SUCCESS): Register a new user', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: 'John Doe', email: 'john@example.com', password: 'password' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'User created successfully');
    //Save action token ID for further testing
    localActionTokenId = response.body.actionToken._id;
    localUserId = response.body.user._id;
    
  });

  it('(FAIL): User already exists', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: 'Dohn Joe', email: 'john@example.com', password: 'password' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error', 'Invalid data input');
  });

  it('(FAIL): Register with empty email', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: 'John Doe', email: '', password: 'password' });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toHaveProperty('msg', 'Invalid email address');
  });

  it('(FAIL): Register with empty name', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: '', email: 'new@example.com', password: 'password' });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toHaveProperty('msg', 'Name is required');
  });

  it('(FAIL): Register with empty password', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({ name: 'Doe John', email: 'new@example.com', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toHaveProperty('msg', 'Password is required');
  }); 
});

describe('Verify user email', () => {
  it('(FAIL): Verify expired email', async () => {
    const localActionToken = await ActionToken.findById(localActionTokenId);
    const oldExpiresAt = localActionToken.expires_at;
    localActionToken.expires_at = new Date();
    await localActionToken.save();

    const response = await request(app)
      .get(`/auth/verify-email/${localActionTokenId}`)
      
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Verification request has expired');

    localActionToken.expires_at = oldExpiresAt;
    await localActionToken.save();
  });

  it('(SUCCESS): Verify user email ', async () => {
    const response = await request(app)
      .get(`/auth/verify-email/${localActionTokenId}`)
      
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Email verified successfully');
  });

  it('(FAIL): Verify email with invalid token', async () => {
    const response = await request(app)
      .get(`/auth/verify-email/65a77b13d564bb44792401b4`)
      
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid verification request');
  });

  it('(FAIL): Try to verify already verified email ', async () => {
    const response = await request(app)
      .get(`/auth/verify-email/${localActionTokenId}`)
      
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Email already verified');
  });

  it('(FAIL): Try to put empty token ', async () => {
    const response = await request(app)
      .get('/auth/verify-email/ ')
      
    expect(response.status).toBe(404);
  });
});

describe('Login user', () => {
  it('(FAIL): Enter wrong email', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'wrong@example.com', password: 'password' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid email');
  });

  it('(FAIL): Try to log in without verified email', async () => {
    const localUser = await User.findById(localUserId);
    const oldEmailVerifiedAt = localUser.email_verified_at;
    localUser.email_verified_at = null;
    await localUser.save();
    
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'john@example.com', password: 'password' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'You have to verify your email before logging in');

    localUser.email_verified_at = oldEmailVerifiedAt;
    await localUser.save();
  });

  it('(FAIL): Enter wrong password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'john@example.com', password: 'wrongPassword' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid password');
  });

  it('(SUCCESS): Login with user', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'john@example.com', password: 'password' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token', response.body.token);

    cookies = response.headers['set-cookie'];
  });

  it('(FAIL): Try to login if already logged in', async () => {
    const response = await request(app)
      .post('/auth/login')
      .set('Cookie', cookies)
      .send({ email: 'john@example.com', password: 'password' });

    expect(response.status).toBe(409);
    expect(response.body).toHaveProperty('message', 'User already logged in');
  });
});

describe('Resend verification email', () => {

  it('(FAIL): Enter wrong email', async () => {
    const response = await request(app)
      .get('/auth/resend-verification')
      .send({ email: 'wrong@example.com', password: 'password' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid email');
  });

  it('(FAIL): Enter wrong password', async () => {
    const response = await request(app)
      .get('/auth/resend-verification')
      .send({ email: 'john@example.com', password: 'wrongPassword' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Invalid password');
  });

  it('(FAIL): Enter password shorter than 6 characters', async () => {
    const response = await request(app)
      .get('/auth/resend-verification')
      .send({ email: 'john@example.com', password: 'less' });

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toHaveProperty('msg', 'Password must be at least 6 characters long');
  });

  it('(FAIL): Enter email that is already verified', async () => {
    const response = await request(app)
      .get('/auth/resend-verification')
      .send({ email: 'john@example.com', password: 'password' });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('error', 'Email already verified');
  });

  it('(SUCCESS): Re-send verification', async () => {
    const localUser = await User.findById(localUserId);
    const oldEmailVerifiedAt = localUser.email_verified_at;
    localUser.email_verified_at = null;
    await localUser.save();

    const response = await request(app)
      .get('/auth/resend-verification')
      .send({ email: 'john@example.com', password: 'password' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Action token created successfully');
    expect(response.body).toHaveProperty('message2', 'Email verification resent');

    localUser.email_verified_at = oldEmailVerifiedAt;
    await localUser.save();
  });
});

describe('Show user', () => {
  it('(SUCCESS): Try to find a new user', async () => {
    const response = await request(app)
      .get(`/users/${localUserId}`);

    expect(response.status).toBe(200);
  });

  it('(FAIL): Try to find non-existent user', async () => {
    const response = await request(app)
      .get(`/users/65a7bebf33984a8df8d443bd`)

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not found');
  }); 

  it('(FAIL): Wrong user ID format', async () => {
    const response = await request(app)
      .get(`/users/65a7bebf33984ad443bd`)

    expect(response.status).toBe(500);
  }); 
});

describe('Update user', () => {
  it('(SUCCESS): Update a new user', async () => {
    const response = await request(app)
      .put(`/users/update/${localUserId}`)
      .set('Cookie', cookies)
      .send({email: "newblaskovic@example.com", name: "blaskoooooo"});

    expect(response.status).toBe(201);
  });

  it('(FAIL): Update without email', async () => {
    const response = await request(app)
      .put(`/users/update/${localUserId}`)
      .set('Cookie', cookies)
      .send({email: "", name: "blaskoooooo"});

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toHaveProperty('msg', 'Invalid email address');
  });

  it('(FAIL): Update without password', async () => {
    const response = await request(app)
      .put(`/users/update/${localUserId}`)
      .set('Cookie', cookies)
      .send({email: "new@example.com", name: ""});

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toHaveProperty('msg', 'Name cannot be empty');
  });

  it('(FAIL): Update with all empty properties', async () => {
    const response = await request(app)
      .put(`/users/update/${localUserId}`)
      .set('Cookie', cookies)
      .send({email: "", name: ""});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });

  it('(FAIL): User not found in database', async () => {
    const response = await request(app)
      .put(`/users/update/65a7c91f1d3131ef99857588`)
      .set('Cookie', cookies)
      .send({email: "unknown@example.com", name: "123456"});

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'User not updated');
  });
});

describe('Generate short URL', () => {
  it('(FAIL): Invalid long URL', async () => {
    const response = await request(app)
      .post(`/url`)
      .set('Cookie', cookies)
      .send({shortUrl: "ytbe", longUrl: ""});

    expect(response.status).toBe(400);
    expect(response.body.errors[0]).toHaveProperty('msg', 'Long URL is required');
  });

  it('(FAIL): Invalid short URL', async () => {
    const response = await request(app)
      .post(`/url`)
      .set('Cookie', cookies)
      .send({shortUrl: "", longUrl: "http://www.youtube.com"});

      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty('msg', 'Short URL is required');
  });

  it('(FAIL): Empty short and long URL input', async () => {
    const response = await request(app)
      .post(`/url`)
      .set('Cookie', cookies)
      .send({shortUrl: "", longUrl: ""});

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('errors');
  });

  it('(SUCCESS): Create a short URL', async () => {
    const response = await request(app)
      .post(`/url`)
      .set('Cookie', cookies)
      .send({shortUrl: "ytbe", longUrl: "http://www.youtube.com"});

    expect(response.status).toBe(201);
    localShortUrlId = response.body._id;
  });

  it('(FAIL): Create same shortened URL', async () => {
    const response = await request(app)
      .post(`/url`)
      .set('Cookie', cookies)
      .send({shortUrl: "ytbe", longUrl: "http://www.youtube.com"});

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message', 'Url already exists');
  });
});

describe('Redirect to long URL', () => {
  it('(SUCCESS): Redirect to long URL using short URL', async () => {
    const response = await request(app)
      .get(`/url/ytbe`)
      .set('Cookie', cookies)

    expect(response.status).toBe(302);
  });

  it('(FAIL): Redirect using wrong short URL', async () => {
    const response = await request(app)
      .get(`/url/youtube`)
      .set('Cookie', cookies)

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Long URL not found');
  });

});

describe('Show long URL', () => {
  it('(SUCCESS): Show long URL without redirecting', async () => {
    const response = await request(app)
      .get('/url/show-long-url/ytbe')
      .set('Cookie', cookies)

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Long url found successfully');
  });

  it('(FAIL): Redirect using wrong short URL', async () => {
    const response = await request(app)
      .get('/url/show-long-url/tby')
      .set('Cookie', cookies)

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Long URL not found');
  });
});

describe('Update short URL', () => {
  it('(SUCCESS): Update short URL data', async () => { 
    const response = await request(app)
      .put(`/url/update/${localShortUrlId}`)
      .set('Cookie', cookies)
      .send({shortUrl: "yt", longUrl: "http://www.youtube.com"});

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Short URL updated successfully');
  });

  it('(FAIL): Enter wrong short URL ID', async () => { 
    const response = await request(app)
      .put(`/url/update/65aa35391bab5d8577c69558`)
      .set('Cookie', cookies)
      .send({shortUrl: "yt", longUrl: "http://www.youtube.com"});

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Short URL not updated');
  });

  it('(FAIL): Update with empty shortUrl', async () => { 
    const response = await request(app)
      .put(`/url/update/${localShortUrlId}`)
      .set('Cookie', cookies)
      .send({shortUrl: "",longUrl: "www.yahoo.com"});

      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty('msg', 'Short URL is required');
  });

  it('(FAIL): Update with empty longUrl', async () => { 
    const response = await request(app)
      .put(`/url/update/${localShortUrlId}`)
      .set('Cookie', cookies)
      .send({shortUrl: "ytber",longUrl: ""});

      expect(response.status).toBe(400);
      expect(response.body.errors[0]).toHaveProperty('msg', 'Long URL is required');
  });
}); 

describe('Show list and Delete short URL', () => {
  it('(SUCCESS): Show all user short urls', async () => {
    const response = await request(app)
      .get('/url/list')
      .set('Cookie', cookies)

    expect(response.status).toBe(200);
  });

  it('(SUCCESS): Delete short URL data', async () => { 
    const response = await request(app)
      .delete(`/url/delete/${localShortUrlId}`)
      .set('Cookie', cookies)

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Short URL deleted successfully');
  });

  it('(SUCCESS): Show all user short urls', async () => {
    const response = await request(app)
      .get('/url/list')
      .set('Cookie', cookies)

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'No urls found');

  });

  it('(FAIL): Short url not found', async () => { 
    const response = await request(app)
      .delete(`/url/delete/${localShortUrlId}`)
      .set('Cookie', cookies)

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error', 'Short URL not found');
  });
}); 


