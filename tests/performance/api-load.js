import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '20s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  const response = http.get('http://localhost:4000/api/health');

  check(response, {
    'status 200': (r) => r.status === 200,
  });

  sleep(1);
}
