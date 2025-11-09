const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'rides.json');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// helper read/write (simple; OK for prototype)
function readData(){
  try{
    const raw = fs.readFileSync(DATA_FILE,'utf8');
    return JSON.parse(raw || '[]');
  }catch(e){
    return [];
  }
}
function writeData(data){
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// POST /ride -> add a ride entry
app.post('/ride', (req,res) => {
  const { riderId, km, elevation, duration, avgSpeed, timestamp } = req.body;
  if(!riderId || km == null || duration == null) {
    return res.status(400).json({ error: 'riderId, km and duration required' });
  }
  const rides = readData();
  const entry = {
    rideId: 'r_' + Date.now(),
    riderId: String(riderId),
    km: Number(km),
    elevation: Number(elevation || 0),
    duration: Number(duration),
    avgSpeed: avgSpeed == null ? null : Number(avgSpeed),
    timestamp: timestamp || new Date().toISOString()
  };
  rides.push(entry);
  writeData(rides);
  return res.json({ success:true, entry });
});

// GET /leaderboard -> aggregated totals by rider, sorted by total km desc
app.get('/leaderboard', (req,res) => {
  const rides = readData();
  const map = {};
  rides.forEach(r => {
    const id = r.riderId;
    if(!map[id]) map[id] = { riderId: id, totalKm:0, totalElevation:0, totalDuration:0, totalAvgSpeed:0, avgSpeedCount:0 };
    map[id].totalKm += (r.km || 0);
    map[id].totalElevation += (r.elevation || 0);
    map[id].totalDuration += (r.duration || 0);
    if(r.avgSpeed != null){ map[id].totalAvgSpeed += r.avgSpeed; map[id].avgSpeedCount += 1; }
  });
  const arr = Object.values(map).map(x => {
    return {
      riderId: x.riderId,
      totalKm: x.totalKm,
      totalElevation: x.totalElevation,
      totalDuration: x.totalDuration,
      avgSpeed: x.avgSpeedCount ? x.totalAvgSpeed / x.avgSpeedCount : 0
    };
  }).sort((a,b) => b.totalKm - a.totalKm);
  res.json(arr);
});

// basic health
app.get('/', (req,res) => res.send('Cycling leaderboard backend running'));

app.listen(PORT, () => {
  console.log(`Backend listening on ${PORT}`);
});
