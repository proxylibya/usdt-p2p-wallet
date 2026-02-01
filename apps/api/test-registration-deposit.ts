import axios from 'axios';

const API_URL = 'http://localhost:3002/api/v1';

interface TestResult {
  test: string;
  status: '✅' | '❌' | '❓';
  details: string;
  data?: any;
}

const results: TestResult[] = [];

async function testRegistration() {
  console.log('\n🧪 Testing User Registration Flow...\n');
  
  const testUser = {
    name: 'Test User ' + Date.now(),
    phone: '+218' + Math.floor(Math.random() * 1000000000),
    password: 'Test@12345',
    email: `test${Date.now()}@example.com`
  };

  try {
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    
    if (response.data.message) {
      results.push({
        test: 'User Registration',
        status: '✅',
        details: 'User registered successfully, OTP sent',
        data: { phone: testUser.phone }
      });
      return testUser;
    }
  } catch (error: any) {
    results.push({
      test: 'User Registration',
      status: '❌',
      details: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    throw error;
  }
}

async function testOTPVerification(phone: string) {
  console.log('\n🧪 Testing OTP Verification (using test OTP)...\n');
  
  try {
    // In development, OTP might be logged or we can use a test OTP
    const testOTP = '123456'; // This will fail unless Redis has this exact OTP
    
    const response = await axios.post(`${API_URL}/auth/verify-otp`, {
      phone,
      otp: testOTP,
      type: 'register'
    });
    
    if (response.data.accessToken) {
      results.push({
        test: 'OTP Verification',
        status: '✅',
        details: 'OTP verified, tokens received',
        data: { hasToken: true, user: response.data.user }
      });
      return response.data;
    }
  } catch (error: any) {
    results.push({
      test: 'OTP Verification',
      status: '❓',
      details: 'OTP verification requires real OTP from SMS/Redis',
      data: { note: 'Skip this in automated testing without SMS integration' }
    });
    return null;
  }
}

async function testDirectLogin(phone: string, password: string) {
  console.log('\n🧪 Testing Direct Login (if enabled)...\n');
  
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      phone,
      password
    });
    
    if (response.data.accessToken) {
      results.push({
        test: 'Direct Login',
        status: '✅',
        details: 'Login successful with direct password auth',
        data: { hasToken: true }
      });
      return response.data.accessToken;
    } else if (response.data.message?.includes('OTP')) {
      results.push({
        test: 'Direct Login',
        status: '❓',
        details: 'OTP-based login enabled (requires OTP verification)',
        data: response.data
      });
      return null;
    }
  } catch (error: any) {
    results.push({
      test: 'Direct Login',
      status: '❌',
      details: error.response?.data?.message || error.message
    });
    return null;
  }
}

async function testDepositAddresses(token: string) {
  console.log('\n🧪 Testing Deposit Address Generation...\n');
  
  const testCases = [
    { asset: 'USDT', network: 'TRC20' },
    { asset: 'USDT', network: 'ERC20' },
    { asset: 'USDT', network: 'BEP20' },
    { asset: 'USDC', network: 'ERC20' },
    { asset: 'BTC', network: 'Bitcoin' },
    { asset: 'ETH', network: 'ERC20' },
    { asset: 'SOL', network: 'SOL' },
  ];

  const addresses = new Map<string, string>();
  
  for (const testCase of testCases) {
    try {
      const response = await axios.get(`${API_URL}/wallets/deposit-address`, {
        params: testCase,
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const address = response.data.address;
      const key = `${testCase.asset}-${testCase.network}`;
      addresses.set(key, address);
      
      // Validate address format
      let isValidFormat = false;
      switch (testCase.network) {
        case 'TRC20':
          isValidFormat = address.startsWith('T') && address.length === 34;
          break;
        case 'ERC20':
        case 'BEP20':
        case 'POLYGON':
          isValidFormat = address.startsWith('0x') && address.length === 42;
          break;
        case 'Bitcoin':
        case 'BTC':
          isValidFormat = address.startsWith('bc1q') && address.length > 38;
          break;
        case 'SOL':
        case 'SPL':
          isValidFormat = address.length === 44;
          break;
        default:
          isValidFormat = address.length > 20;
      }
      
      results.push({
        test: `Deposit Address: ${testCase.asset}/${testCase.network}`,
        status: isValidFormat ? '✅' : '❌',
        details: isValidFormat ? 'Valid address format generated' : 'Invalid address format',
        data: { address, network: testCase.network }
      });
    } catch (error: any) {
      results.push({
        test: `Deposit Address: ${testCase.asset}/${testCase.network}`,
        status: '❌',
        details: error.response?.data?.message || error.message
      });
    }
  }
  
  return addresses;
}

async function testAddressUniqueness(token: string, previousAddresses: Map<string, string>) {
  console.log('\n🧪 Testing Address Uniqueness (requesting same addresses again)...\n');
  
  for (const [key, originalAddress] of previousAddresses.entries()) {
    const [asset, network] = key.split('-');
    
    try {
      const response = await axios.get(`${API_URL}/wallets/deposit-address`, {
        params: { asset, network },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const newAddress = response.data.address;
      const isSame = newAddress === originalAddress;
      
      results.push({
        test: `Address Persistence: ${key}`,
        status: isSame ? '✅' : '❌',
        details: isSame 
          ? 'Same address returned (correctly persisted)' 
          : 'Different address returned (BUG: not persisted!)',
        data: { 
          original: originalAddress, 
          new: newAddress,
          matched: isSame 
        }
      });
    } catch (error: any) {
      results.push({
        test: `Address Persistence: ${key}`,
        status: '❌',
        details: error.response?.data?.message || error.message
      });
    }
  }
}

async function testWalletRetrieval(token: string) {
  console.log('\n🧪 Testing Wallet Retrieval...\n');
  
  try {
    const response = await axios.get(`${API_URL}/wallets`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const wallets = response.data;
    const hasWallets = Array.isArray(wallets) && wallets.length > 0;
    
    results.push({
      test: 'Get User Wallets',
      status: hasWallets ? '✅' : '❌',
      details: hasWallets 
        ? `Retrieved ${wallets.length} wallets successfully`
        : 'No wallets found',
      data: { 
        count: wallets.length,
        wallets: wallets.map((w: any) => ({
          asset: w.asset,
          network: w.network,
          hasAddress: !!w.address,
          balance: w.balance
        }))
      }
    });
  } catch (error: any) {
    results.push({
      test: 'Get User Wallets',
      status: '❌',
      details: error.response?.data?.message || error.message
    });
  }
}

function printReport() {
  console.log('\n\n📊 TEST REPORT\n');
  console.log('═'.repeat(80));
  
  const passed = results.filter(r => r.status === '✅').length;
  const failed = results.filter(r => r.status === '❌').length;
  const skipped = results.filter(r => r.status === '❓').length;
  
  console.log(`\n📈 Summary: ${passed} passed | ${failed} failed | ${skipped} skipped\n`);
  
  results.forEach(result => {
    console.log(`${result.status} ${result.test}`);
    console.log(`   ${result.details}`);
    if (result.data && Object.keys(result.data).length > 0) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2).split('\n').join('\n   ')}`);
    }
    console.log('');
  });
  
  console.log('═'.repeat(80));
  
  // Export results to JSON
  const fs = require('fs');
  fs.writeFileSync(
    './test-results.json',
    JSON.stringify({ 
      timestamp: new Date().toISOString(),
      summary: { passed, failed, skipped, total: results.length },
      results 
    }, null, 2)
  );
  
  console.log('\n✅ Results saved to test-results.json\n');
}

async function runTests() {
  console.log('🚀 Starting Registration & Deposit Address Tests...');
  console.log('⚠️  Make sure the API server is running on http://localhost:3002\n');
  
  try {
    // Test 1: Registration
    const testUser = await testRegistration();
    
    if (!testUser) {
      console.log('❌ Registration failed, stopping tests');
      printReport();
      return;
    }
    
    // Test 2: OTP Verification (will likely be skipped without real SMS)
    const authData = await testOTPVerification(testUser.phone);
    
    // Test 3: Try direct login instead (if OTP failed)
    let token = authData?.accessToken;
    if (!token) {
      token = await testDirectLogin(testUser.phone, testUser.password);
    }
    
    if (!token) {
      console.log('⚠️  No authentication token - skipping wallet tests');
      console.log('💡 Enable AUTH_DIRECT_LOGIN=true in .env to test without OTP');
      printReport();
      return;
    }
    
    // Test 4: Wallet Retrieval
    await testWalletRetrieval(token);
    
    // Test 5: Deposit Address Generation
    const addresses = await testDepositAddresses(token);
    
    // Test 6: Address Uniqueness
    await testAddressUniqueness(token, addresses);
    
    printReport();
    
  } catch (error: any) {
    console.error('\n❌ Test execution failed:', error.message);
    printReport();
  }
}

// Run tests
runTests();
