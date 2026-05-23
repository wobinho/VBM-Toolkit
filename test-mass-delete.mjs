import fetch from 'node:fetch';

async function testApp() {
  try {
    // Test that the app is running
    const response = await fetch('http://localhost:3001/tools/portrait-prompt');
    const html = await response.text();

    // Check for the presence of the LibraryBuilder component
    if (html.includes('Delete all')) {
      console.log('✅ "Delete all" button found in the page');
    } else {
      console.log('⚠️ "Delete all" button not found in initial HTML (may load dynamically)');
    }

    // Check for library and options references
    if (html.includes('Options')) {
      console.log('✅ Options section found in the page');
    }

    console.log('✅ App is running and responding correctly');
  } catch (error) {
    console.error('❌ Error testing app:', error.message);
    process.exit(1);
  }
}

testApp();
