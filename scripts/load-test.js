/**
 * Load testing script using k6
 * 
 * Installation:
 *   brew install k6  # macOS
 *   # or download from https://k6.io/docs/getting-started/installation/
 * 
 * Usage:
 *   k6 run scripts/load-test.js
 * 
 * With custom options:
 *   k6 run --vus 50 --duration 30s scripts/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 50 },  // Ramp up to 50 users
    { duration: '2m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '30s', target: 0 },   // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be less than 5%
    errors: ['rate<0.1'],              // Custom error rate
  },
};

// Base URL - change this to your production URL
const BASE_URL = __ENV.BASE_URL || 'https://ride-together-liart.vercel.app';

export default function () {
  // Test 1: Homepage
  const homeResponse = http.get(`${BASE_URL}/`);
  const homeCheck = check(homeResponse, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in < 2s': (r) => r.timings.duration < 2000,
  });
  errorRate.add(!homeCheck);
  sleep(1);

  // Test 2: Search page
  const searchResponse = http.get(`${BASE_URL}/search?from=Москва&to=Санкт-Петербург&passengers=1`);
  const searchCheck = check(searchResponse, {
    'search status is 200': (r) => r.status === 200,
    'search loads in < 3s': (r) => r.timings.duration < 3000,
  });
  errorRate.add(!searchCheck);
  sleep(1);

  // Test 3: API endpoint (if available)
  // const apiResponse = http.get(`${BASE_URL}/api/rides`);
  // check(apiResponse, {
  //   'api status is 200': (r) => r.status === 200,
  // });
  // sleep(1);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
    'load-test-results.json': JSON.stringify(data),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;
  
  let summary = '\n';
  summary += `${indent}Load Test Summary\n`;
  summary += `${indent}================\n\n`;
  
  // HTTP metrics
  if (data.metrics.http_req_duration) {
    const duration = data.metrics.http_req_duration;
    summary += `${indent}HTTP Request Duration:\n`;
    summary += `${indent}  Average: ${duration.values.avg.toFixed(2)}ms\n`;
    summary += `${indent}  P95: ${duration.values['p(95)'].toFixed(2)}ms\n`;
    summary += `${indent}  P99: ${duration.values['p(99)'].toFixed(2)}ms\n`;
  }
  
  if (data.metrics.http_req_failed) {
    const failed = data.metrics.http_req_failed;
    summary += `${indent}\nHTTP Request Failed:\n`;
    summary += `${indent}  Rate: ${(failed.values.rate * 100).toFixed(2)}%\n`;
  }
  
  if (data.metrics.http_reqs) {
    const reqs = data.metrics.http_reqs;
    summary += `${indent}\nHTTP Requests:\n`;
    summary += `${indent}  Total: ${reqs.values.count}\n`;
    summary += `${indent}  Rate: ${reqs.values.rate.toFixed(2)}/s\n`;
  }
  
  return summary;
}

