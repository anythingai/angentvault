import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,               // 100 concurrent users
  duration: '30s',        // for 30 seconds
  thresholds: {
    http_req_duration: ['p(95)<200'], // 95% of requests below 200ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  },
};

// eslint-disable-next-line no-undef
const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000';

export default function loadTest() {
  // Health check
  const res = http.get(`${BASE_URL}/health`);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'latency < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}