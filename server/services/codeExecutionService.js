const { Worker } = require('worker_threads');
const path = require('path');
const logger = require('../config/logger');
const errorHandler = require('../utils/errorHandler');

class CodeExecutionService {
  constructor() {
    this.workerPool = new Map();
    this.defaultConfig = {
      timeout: 5000, // 5 seconds
      memory: 128 * 1024 * 1024, // 128MB
      maxWorkers: 10
    };
  }

  /**
   * Execute code in a sandboxed environment
   * @param {string} code - Code to execute
   * @param {string} language - Programming language
   * @param {Object} config - Execution configuration
   * @returns {Promise<Object>} Execution result
   */
  async execute(code, language, config = {}) {
    const executionConfig = {
      ...this.defaultConfig,
      ...config
    };

    try {
      // Validate input
      if (!code || !language) {
        throw new Error('Code and language are required');
      }

      // Get appropriate worker
      const worker = await this.getWorker(language);
      if (!worker) {
        throw new Error(`Language ${language} is not supported`);
      }

      // Execute code
      const result = await this.runInWorker(worker, code, executionConfig);
      return result;
    } catch (error) {
      errorHandler.handle(error);
      throw error;
    }
  }

  /**
   * Get or create worker for language
   * @private
   */
  async getWorker(language) {
    // Check if worker exists and is idle
    let worker = this.workerPool.get(language);
    if (worker && !worker.busy) {
      return worker;
    }

    // Clean up old workers if pool is full
    if (this.workerPool.size >= this.defaultConfig.maxWorkers) {
      await this.cleanWorkerPool();
    }

    // Create new worker
    try {
      const workerScript = this.getWorkerScript(language);
      const newWorker = {
        thread: new Worker(workerScript),
        busy: false,
        language,
        startTime: Date.now()
      };

      // Setup error handling
      newWorker.thread.on('error', (error) => {
        logger.error(`Worker error: ${error.message}`);
        newWorker.error = error;
        this.cleanupWorker(newWorker);
      });

      this.workerPool.set(language, newWorker);
      return newWorker;
    } catch (error) {
      logger.error(`Failed to create worker for ${language}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get worker script path for language
   * @private
   */
  getWorkerScript(language) {
    const scripts = {
      javascript: path.join(__dirname, '../workers/javascriptWorker.js'),
      // Add more language workers here
    };

    return scripts[language];
  }

  /**
   * Run code in worker thread
   * @private
   */
  async runInWorker(worker, code, config) {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime();
      let timeoutId;

      const cleanup = () => {
        clearTimeout(timeoutId);
        worker.busy = false;
        worker.thread.removeAllListeners('message');
        worker.thread.removeAllListeners('error');
      };

      // Set execution timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Execution timed out after ${config.timeout}ms`));
      }, config.timeout);

      // Setup message handling
      worker.thread.once('message', (result) => {
        const [seconds, nanoseconds] = process.hrtime(startTime);
        const duration = seconds * 1000 + nanoseconds / 1e6;
        
        cleanup();
        resolve({
          ...result,
          duration,
          memory: {
            used: result.memory?.heapUsed || 0,
            limit: config.memory
          }
        });
      });

      // Handle worker errors
      worker.thread.once('error', (error) => {
        cleanup();
        reject(error);
      });

      // Mark worker as busy
      worker.busy = true;

      // Send code to worker
      worker.thread.postMessage({
        code,
        config: {
          memory: config.memory
        }
      });
    });
  }

  /**
   * Clean up worker pool
   * @private
   */
  async cleanWorkerPool() {
    const now = Date.now();
    
    for (const [language, worker] of this.workerPool.entries()) {
      // Remove workers that are:
      // 1. Not busy and older than 5 minutes
      // 2. Have errors
      // 3. Are busy for too long (possibly hung)
      if (
        (!worker.busy && now - worker.startTime > 5 * 60 * 1000) ||
        worker.error ||
        (worker.busy && now - worker.startTime > this.defaultConfig.timeout * 2)
      ) {
        await this.cleanupWorker(worker);
        this.workerPool.delete(language);
      }
    }
  }

  /**
   * Clean up a single worker
   * @private
   */
  async cleanupWorker(worker) {
    try {
      await worker.thread.terminate();
    } catch (error) {
      logger.error(`Failed to terminate worker: ${error.message}`);
    }
  }

  /**
   * Clean up service
   */
  async cleanup() {
    for (const worker of this.workerPool.values()) {
      await this.cleanupWorker(worker);
    }
    this.workerPool.clear();
  }
}

// Export singleton instance
module.exports = new CodeExecutionService();
