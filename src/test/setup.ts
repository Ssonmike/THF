// Global test setup for TheHomeFood
// Sets up any global mocks or configuration before tests run.

// Suppress console.error in tests unless VERBOSE=true
if (!process.env.VERBOSE) {
  console.error = () => {};
}
