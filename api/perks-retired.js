export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 410;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({
    ok: false,
    error: 'echo_perks_retired',
    message: 'Echo Perks has ended and new claims are closed.',
    home: 'https://www.builtbyecho.xyz/',
  }));
}
