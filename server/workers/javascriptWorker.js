const { parentPort } = require('worker_threads');
const vm = require('vm');
const util = require('util');

/**
 * Execute JavaScript code in a sandboxed context
 * @param {string} code - Code to execute
 * @param {Object} config - Execution configuration
 * @returns {Object} Execution result
 */
function executeJavaScript(code, config) {
  // Create sandbox context
  const sandbox = {
    console: {
      _logs: [],
      log: (...args) => {
        sandbox.console._logs.push(
          args.map(arg => 
            typeof arg === 'object' 
              ? util.inspect(arg, { depth: 2, colors: false })
              : String(arg)
          ).join(' ')
        );
      },
      error: (...args) => {
        sandbox.console._logs.push(
          `Error: ${args.map(arg => String(arg)).join(' ')}`
        );
      },
      warn: (...args) => {
        sandbox.console._logs.push(
          `Warning: ${args.map(arg => String(arg)).join(' ')}`
        );
      }
    },
    Buffer: {}, // Restricted Buffer API
    setTimeout: (fn, delay) => {
      if (delay > config.timeout) {
        throw new Error(`setTimeout delay exceeds maximum timeout of ${config.timeout}ms`);
      }
      return setTimeout(fn, delay);
    },
    setInterval: () => {
      throw new Error('setInterval is not allowed in code execution');
    },
    process: {
      env: {},
      hrtime: process.hrtime
    },
    // Add more safe globals here
  };

  // Create context with memory limits
  const context = vm.createContext(sandbox);

  try {
    // Wrap code in async function to allow await
    const wrappedCode = `
      (async function() {
        try {
          ${code}
        } catch (error) {
          console.error(error.message);
          return { error: error.message };
        }
      })()
    `;

    // Execute code with timeout
    const script = new vm.Script(wrappedCode);
    const result = script.runInContext(context, {
      timeout: config.timeout,
      displayErrors: true
    });

    // Get memory usage
    const memoryUsage = process.memoryUsage();

    // Check memory limits
    if (memoryUsage.heapUsed > config.memory) {
      throw new Error(`Memory limit exceeded: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB used`);
    }

    return {
      output: sandbox.console._logs.join('\n'),
      result: result,
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external
      }
    };
  } catch (error) {
    return {
      error: error.message,
      memory: process.memoryUsage()
    };
  }
}

// Handle messages from parent
parentPort.on('message', async ({ code, config }) => {
  try {
    // Set default config
    const executionConfig = {
      timeout: 5000,
      memory: 128 * 1024 * 1024,
      ...config
    };

    // Execute code
    const result = await executeJavaScript(code, executionConfig);

    // Send result back to parent
    parentPort.postMessage(result);
  } catch (error) {
    // Handle unexpected errors
    parentPort.postMessage({
      error: 'Internal execution error: ' + error.message,
      memory: process.memoryUsage()
    });
  }
});

// Handle errors
process.on('uncaughtException', (error) => {
  parentPort.postMessage({
    error: 'Uncaught exception: ' + error.message,
    memory: process.memoryUsage()
  });
});

process.on('unhandledRejection', (error) => {
  parentPort.postMessage({
    error: 'Unhandled rejection: ' + error.message,
    memory: process.memoryUsage()
  });
});

// Notify parent that worker is ready
parentPort.postMessage({ status: 'ready' });
