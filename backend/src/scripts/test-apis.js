import { logger } from '../config/logger.js';

const BASE_URL = 'http://localhost:5050/api/v1';

async function runTests() {
  console.log('\n\x1b[35m=== RUNNING LOCALLY DIRECT API TESTS ===\x1b[0m\n');

  let token = '';

  // 1. Register Dispatcher User
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Raven Kumar',
        email: 'dispatcher@transitops.in',
        password: 'transitpass123',
        role: 'dispatcher',
      }),
    });

    const regData = await regRes.json();
    if (regRes.status === 201 || regRes.status === 400) {
      console.log('✅ \x1b[32mRegister Endpoint Check Passed\x1b[0m');
      console.log('   Response Status:', regRes.status);
      console.log('   Message:', regData.message);
    } else {
      console.log('❌ \x1b[31mRegister Failed\x1b[0m');
      console.log('   Response Status:', regRes.status, regData);
    }
  } catch (err) {
    console.log('❌ \x1b[31mRegister API Connection Error:\x1b[0m', err.message);
    return;
  }

  // 2. Login User
  try {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'dispatcher@transitops.in',
        password: 'transitpass123',
      }),
    });

    const loginData = await loginRes.json();
    if (loginRes.ok) {
      token = loginData.data.accessToken;
      console.log('✅ \x1b[32mLogin Endpoint Check Passed\x1b[0m');
      console.log('   Received Token:', token.substring(0, 15) + '...');
    } else {
      console.log('❌ \x1b[31mLogin Failed\x1b[0m');
      console.log('   Response Status:', loginRes.status, loginData);
      return;
    }
  } catch (err) {
    console.log('❌ \x1b[31mLogin API Connection Error:\x1b[0m', err.message);
    return;
  }

  // 3. Fetch User Profile
  try {
    const profileRes = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    const profileData = await profileRes.json();
    if (profileRes.ok) {
      console.log('✅ \x1b[32mAuth Token Protected Profile Check Passed\x1b[0m');
      console.log('   Logged In User:', profileData.data.name);
      console.log('   Role:', profileData.data.role);
    } else {
      console.log('❌ \x1b[31mProfile Retrieve Failed\x1b[0m');
      console.log('   Response Status:', profileRes.status, profileData);
    }
  } catch (err) {
    console.log('❌ \x1b[31mProfile API Connection Error:\x1b[0m', err.message);
  }

  console.log('\n\x1b[35m=== API VERIFICATION COMPLETED ===\x1b[0m\n');
}

runTests();
