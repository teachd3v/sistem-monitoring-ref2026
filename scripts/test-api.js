fetch('http://localhost:3000/api/sync-legacy-data', { method: 'POST' })
  .then(r => r.json())
  .then(data => {
      console.log('--- DB PENDING SAMPLE ---');
      console.log(JSON.stringify(data.debugPendingData, null, 2));
      console.log('--- UPDATES TO BE SENT ---');
      console.log(JSON.stringify(data.debugSampleUpdates, null, 2));
  });
