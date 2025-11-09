// Change BACKEND_URL if you host backend elsewhere
const BACKEND_URL = window.BACKEND_URL || (location.hostname === 'localhost' ? 'http://localhost:3000' : '');

const rideForm = document.getElementById('rideForm');
const leaderboardArea = document.getElementById('leaderboardArea');
const msgEl = document.getElementById('msg');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchLeaderboard(){
  leaderboardArea.innerHTML = 'Loading...';
  try{
    const res = await fetch(`${BACKEND_URL}/leaderboard`);
    if(!res.ok) throw new Error('Failed');
    const data = await res.json();
    renderLeaderboard(data);
  }catch(err){
    leaderboardArea.innerHTML = `<div style="color:#f88">Could not load leaderboard. Make sure backend is running and CORS allowed.</div>`;
  }
}

function renderLeaderboard(list){
  if(!Array.isArray(list) || list.length===0){
    leaderboardArea.innerHTML = `<div style="color:var(--muted)">No rides yet. Be the first!</div>`;
    return;
  }
  leaderboardArea.innerHTML = '';
  list.forEach((r, idx) => {
    const item = document.createElement('div');
    item.className = 'lb-row';
    item.innerHTML = `
      <div class="left">
        <div class="avatar">${(r.riderId||'--').slice(0,2).toUpperCase()}</div>
        <div>
          <div style="font-weight:700">${idx+1}. ${r.riderId}</div>
          <div class="kpi">Total km: <strong>${Number(r.totalKm).toFixed(2)} km</strong></div>
        </div>
      </div>
      <div style="text-align:right">
        <div class="kpi">Total elevation: <strong>${Math.round(r.totalElevation)} m</strong></div>
        <div class="kpi">Total time: <strong>${Math.round(r.totalDuration)} min</strong></div>
        <div class="kpi">Avg speed (avg): <strong>${(r.avgSpeed || 0).toFixed(2)} km/h</strong></div>
      </div>
    `;
    leaderboardArea.appendChild(item);
  });
}

rideForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  msgEl.textContent = '';
  const payload = {
    riderId: document.getElementById('riderId').value.trim(),
    km: parseFloat(document.getElementById('km').value) || 0,
    elevation: parseFloat(document.getElementById('elevation').value) || 0,
    duration: parseFloat(document.getElementById('duration').value) || 0,
    avgSpeed: parseFloat(document.getElementById('avgSpeed').value) || null,
    timestamp: new Date().toISOString()
  };
  if(!payload.riderId){ msgEl.textContent = 'Rider ID is required'; return; }
  try{
    const res = await fetch(`${BACKEND_URL}/ride`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload),
    });
    if(!res.ok) throw new Error('Failed to save');
    msgEl.textContent = 'Ride saved!';
    rideForm.reset();
    fetchLeaderboard();
  }catch(err){
    msgEl.textContent = 'Error saving ride. Check backend.';
  }
});

refreshBtn.addEventListener('click', fetchLeaderboard);
window.addEventListener('load', fetchLeaderboard);
