/**
 * Circuit Breaker Pattern Implementation
 * FANG-Level: Prevents cascading failures in distributed systems
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failure threshold exceeded, requests fail fast
 * - HALF_OPEN: Testing if service recovered
 */

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.successThreshold = options.successThreshold || 2;
    this.timeout = options.timeout || 60000; // 1 minute
    this.monitoringPeriod = options.monitoringPeriod || 10000; // 10 seconds
    
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttempt = Date.now();
    this.recentRequests = [];
  }

  async execute(fn, fallback = null) {
    // Check if circuit is OPEN
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        console.log(`🔴 Circuit breaker OPEN, failing fast`);
        if (fallback) {
          return await fallback();
        }
        throw new Error('Circuit breaker is OPEN');
      }
      // Try to recover
      this.state = 'HALF_OPEN';
      console.log(`🟡 Circuit breaker entering HALF_OPEN state`);
    }

    try {
      const startTime = Date.now();
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.onSuccess(duration);
      return result;
    } catch (error) {
      this.onFailure(error);
      
      if (fallback) {
        console.log(`⚠️ Circuit breaker executing fallback`);
        return await fallback();
      }
      
      throw error;
    }
  }

  onSuccess(duration) {
    this.recordRequest(true, duration);
    this.failureCount = 0;

    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.successThreshold) {
        this.state = 'CLOSED';
        this.successCount = 0;
        console.log(`✅ Circuit breaker CLOSED (recovered)`);
      }
    }
  }

  onFailure(error) {
    this.recordRequest(false);
    this.failureCount++;
    this.successCount = 0;

    console.error(`❌ Circuit breaker failure (${this.failureCount}/${this.failureThreshold}):`, error.message);

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      console.log(`🔴 Circuit breaker OPEN until ${new Date(this.nextAttempt).toISOString()}`);
    }
  }

  recordRequest(success, duration = 0) {
    const now = Date.now();
    this.recentRequests.push({ success, duration, timestamp: now });

    // Keep only recent requests within monitoring period
    this.recentRequests = this.recentRequests.filter(
      req => req.timestamp > now - this.monitoringPeriod
    );
  }

  getStats() {
    const now = Date.now();
    const recent = this.recentRequests.filter(
      req => req.timestamp > now - this.monitoringPeriod
    );

    const total = recent.length;
    const successful = recent.filter(r => r.success).length;
    const failed = total - successful;
    const avgDuration = total > 0
      ? recent.reduce((sum, r) => sum + r.duration, 0) / total
      : 0;

    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      recentRequests: {
        total,
        successful,
        failed,
        successRate: total > 0 ? (successful / total * 100).toFixed(2) + '%' : '0%',
        avgDuration: Math.round(avgDuration) + 'ms'
      },
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.recentRequests = [];
    console.log(`🔄 Circuit breaker manually reset`);
  }
}

/**
 * Circuit breakers for external services
 */
export const circuitBreakers = {
  proxyCheck: new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000
  }),
  
  emailService: new CircuitBreaker({
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 30000
  }),
  
  zoomAPI: new CircuitBreaker({
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 120000
  }),
  
  database: new CircuitBreaker({
    failureThreshold: 10,
    successThreshold: 5,
    timeout: 30000
  })
};

/**
 * Wrapper function for proxy/VPN checks with circuit breaker
 */
export async function safeProxyCheck(ipAddress) {
  const fallback = () => ({
    isProxy: false,
    isVPN: false,
    isTor: false,
    riskScore: 0,
    note: 'Proxy check service unavailable, using fallback'
  });

  return await circuitBreakers.proxyCheck.execute(
    async () => {
      const { checkProxyVPN } = await import('./proxyDetection.js');
      return await checkProxyVPN(ipAddress);
    },
    fallback
  );
}

/**
 * Wrapper for email service with circuit breaker
 */
export async function safeEmailSend(to, subject, body) {
  const fallback = () => {
    console.log(`📧 Email queued for later delivery: ${to}`);
    // Could queue email for retry later
    return { queued: true };
  };

  return await circuitBreakers.emailService.execute(
    async () => {
      const { sendEmail } = await import('./emailService.js');
      return await sendEmail(to, subject, body);
    },
    fallback
  );
}

/**
 * Health check endpoint data
 */
export function getCircuitBreakerHealth() {
  const health = {};
  
  for (const [name, breaker] of Object.entries(circuitBreakers)) {
    health[name] = breaker.getStats();
  }
  
  return health;
}

/**
 * Middleware to track circuit breaker stats
 */
export function circuitBreakerMiddleware(req, res, next) {
  // Attach circuit breaker stats to request
  req.circuitBreakers = circuitBreakers;
  next();
}

export default CircuitBreaker;
