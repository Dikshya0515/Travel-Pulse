// Save this as debug-time.js and run: node debug-time.js

console.log("=== COMPREHENSIVE TIME DEBUGGING ===\n");

// 1. Basic JavaScript Date functions
console.log("1. JavaScript Date functions:");
const now = new Date();
console.log("new Date():", now);
console.log("new Date().toString():", now.toString());
console.log("new Date().toISOString():", now.toISOString());
console.log("new Date().getTime():", now.getTime());
console.log("Date.now():", Date.now());
console.log("Math.floor(Date.now() / 1000):", Math.floor(Date.now() / 1000));
console.log("Math.floor(new Date().getTime() / 1000):", Math.floor(new Date().getTime() / 1000));
console.log();

// 2. Process and system information
console.log("2. Process & System Info:");
console.log("Node.js version:", process.version);
console.log("Platform:", process.platform);
console.log("Architecture:", process.arch);
console.log("Process uptime (seconds):", process.uptime());
console.log("Process start time:", new Date(Date.now() - process.uptime() * 1000));

// System uptime (requires os module)
const os = require('os');
console.log("System uptime (seconds):", os.uptime());
console.log("System start time:", new Date(Date.now() - os.uptime() * 1000));
console.log();

// 3. Timezone information
console.log("3. Timezone Info:");
console.log("Timezone (Intl):", Intl.DateTimeFormat().resolvedOptions().timeZone);
console.log("Timezone offset (minutes):", now.getTimezoneOffset());
console.log("Local time string:", now.toLocaleString());
console.log("UTC string:", now.toUTCString());
console.log();

// 4. Environment variables
console.log("4. Environment Variables:");
console.log("TZ environment variable:", process.env.TZ || "Not set");
console.log("NODE_TZ:", process.env.NODE_TZ || "Not set");
console.log();

// 5. Test multiple timestamp calculations
console.log("5. Different Timestamp Calculations:");
const methods = [
  { name: "Date.now() / 1000", value: Date.now() / 1000 },
  { name: "Math.floor(Date.now() / 1000)", value: Math.floor(Date.now() / 1000) },
  { name: "new Date().getTime() / 1000", value: new Date().getTime() / 1000 },
  { name: "Math.floor(new Date().getTime() / 1000)", value: Math.floor(new Date().getTime() / 1000) },
  { name: "~~(Date.now() / 1000)", value: ~~(Date.now() / 1000) },
  { name: "parseInt(Date.now() / 1000)", value: parseInt(Date.now() / 1000) }
];

methods.forEach(method => {
  console.log(`${method.name}: ${method.value}`);
});
console.log();

// 6. Convert timestamps back to readable dates
console.log("6. Convert Timestamps Back to Dates:");
const correctTimestamp = Math.floor(Date.now() / 1000);
const yourBadTimestamp = 1749541774; // From your log

console.log(`Correct timestamp ${correctTimestamp} converts to:`, new Date(correctTimestamp * 1000).toISOString());
console.log(`Your bad timestamp ${yourBadTimestamp} converts to:`, new Date(yourBadTimestamp * 1000).toISOString());
console.log(`Difference: ${yourBadTimestamp - correctTimestamp} seconds`);
console.log(`Difference: ${Math.round((yourBadTimestamp - correctTimestamp) / 86400)} days`);
console.log();

// 7. Test the exact code from your controller
console.log("7. Exact Code from Your Controller:");
const simulatedCurrentTime = Math.floor(Date.now() / 1000);
console.log("const currentTime = Math.floor(Date.now() / 1000):", simulatedCurrentTime);
console.log("new Date().toISOString():", new Date().toISOString());
console.log();

// 8. Check if system clock is wrong
console.log("8. System Clock Check:");
console.log("Current system time should be around June 10, 2025, 1:30-2:00 PM Nepal time");
console.log("Current time in different formats:");
console.log("ISO:", new Date().toISOString());
console.log("Local:", new Date().toLocaleString());
console.log("Nepal time:", new Date().toLocaleString("en-US", {timeZone: "Asia/Kathmandu"}));
console.log();

// 9. Test TOTP library
console.log("9. TOTP Library Test:");
try {
  const { authenticator } = require("otplib");
  const secret = "LALRGEDOPZFSWHQT"; // Your secret from the log
  
  console.log("TOTP Secret:", secret);
  console.log("Current TOTP token:", authenticator.generate(secret));
  console.log("TOTP options:", authenticator.options);
  
  // Test with different timestamps
  const currentTs = Math.floor(Date.now() / 1000);
  const badTs = 1749541774;
  
  console.log("Token with correct timestamp:", authenticator.generate(secret, currentTs));
  console.log("Token with bad timestamp:", authenticator.generate(secret, badTs));
  
} catch (error) {
  console.log("Error testing TOTP:", error.message);
}
console.log();

// 10. Final analysis
console.log("10. ANALYSIS:");
console.log("If any of the above timestamps are wrong, you have a system time issue.");
console.log("If timestamps are correct but TOTP fails, it's a library/secret issue.");
console.log("Your bad timestamp 1749541774 = July 15, 2025 (35 days in future!)");
console.log();

console.log("=== END DEBUGGING ===");