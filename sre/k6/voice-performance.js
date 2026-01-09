import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<450']
  }
};

export default function () {
  const res = http.post('https://api.example.com/api/voice/call', JSON.stringify({ test: true }), { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}