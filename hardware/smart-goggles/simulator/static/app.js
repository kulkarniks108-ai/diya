const statusEl = document.getElementById('status');
const battery = document.getElementById('battery');
const ultra = document.getElementById('ultra');
const fps = document.getElementById('fps');
const telemetryHz = document.getElementById('telemetryHz');
const batteryValue = document.getElementById('batteryValue');
const ultraValue = document.getElementById('ultraValue');
const fpsValue = document.getElementById('fpsValue');
const telemetryHzValue = document.getElementById('telemetryHzValue');
const frame = document.getElementById('frame');
const logsEl = document.getElementById('logs');
const copyLogsBtn = document.getElementById('copyLogsBtn');

const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const hapticBtn = document.getElementById('hapticBtn');
const hapticMs = document.getElementById('hapticMs');
const registerBtn = document.getElementById('registerBtn');
const phoneIp = document.getElementById('phoneIp');

async function api(path, method = 'GET', body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

async function refreshState() {
  const data = await api('/state');
  statusEl.textContent = data.connected ? 'Connected' : 'Disconnected';
  battery.value = data.battery_level;
  ultra.value = data.ultrasonic_cm;
  fps.value = data.stream_fps;
  telemetryHz.value = data.telemetry_hz;
  batteryValue.textContent = data.battery_level;
  ultraValue.textContent = data.ultrasonic_cm;
  fpsValue.textContent = data.stream_fps;
  telemetryHzValue.textContent = data.telemetry_hz;
}

async function updateState() {
  await api('/state', 'POST', {
    battery_level: Number(battery.value),
    ultrasonic_cm: Number(ultra.value),
    stream_fps: Number(fps.value),
    telemetry_hz: Number(telemetryHz.value),
  });
  await refreshState();
}

connectBtn.onclick = () => api('/command', 'POST', { command: 'connect' }).then(refreshState);
disconnectBtn.onclick = () => api('/command', 'POST', { command: 'disconnect' }).then(refreshState);

hapticBtn.onclick = () => api('/command', 'POST', { command: 'haptic', duration_ms: Number(hapticMs.value) });

registerBtn.onclick = () => api('/register-phone', 'POST', { phone_ip: phoneIp.value });

copyLogsBtn.onclick = async () => {
  try {
    await navigator.clipboard.writeText(logsEl.textContent || '');
  } catch (e) {
    alert('Copy failed. Select and copy manually.');
  }
};

[battery, ultra, fps, telemetryHz].forEach((el) => {
  el.oninput = () => {
    batteryValue.textContent = battery.value;
    ultraValue.textContent = ultra.value;
    fpsValue.textContent = fps.value;
    telemetryHzValue.textContent = telemetryHz.value;
  };
  el.onchange = updateState;
});

const frameSource = new EventSource('/stream');
frameSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.data_url) {
    frame.src = data.data_url;
  }
};

const telemetrySource = new EventSource('/telemetry');
telemetrySource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (typeof data.battery_level === 'number') {
    battery.value = data.battery_level;
    batteryValue.textContent = data.battery_level;
  }
  if (typeof data.ultrasonic_cm === 'number') {
    ultra.value = data.ultrasonic_cm;
    ultraValue.textContent = data.ultrasonic_cm;
  }
  statusEl.textContent = data.connected ? 'Connected' : 'Disconnected';
};

async function refreshLogs() {
  try {
    const data = await api('/logs');
    logsEl.textContent = data.items
      .map((item) => `${item.timestamp} ${item.event} ${JSON.stringify(item)}`)
      .join('\n');
  } catch (e) {
    logsEl.textContent = String(e);
  }
}

setInterval(refreshLogs, 1500);

refreshState();
refreshLogs();
