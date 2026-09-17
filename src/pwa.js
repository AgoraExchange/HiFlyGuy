function installed(worker) {
  if (!worker || worker.state === 'installed' || worker.state === 'activated') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Update download timed out. Try again.')), 45000);
    const change = () => {
      if (worker.state === 'installed' || worker.state === 'activated') finish();
      else if (worker.state === 'redundant') finish(new Error('Update download failed. Try again.'));
    };
    function finish(error) { clearTimeout(timer); worker.removeEventListener('statechange', change); error ? reject(error) : resolve(); }
    worker.addEventListener('statechange', change);
    change();
  });
}

export function setupUpdates(saveWorld) {
  const button = document.querySelector('#check-updates');
  const status = document.querySelector('#update-status');
  if (!import.meta.env.PROD) { button.disabled = true; status.textContent = 'Updates are available in the published app.'; return; }
  if (!('serviceWorker' in navigator)) { button.disabled = true; status.textContent = 'App updates need a supported browser and HTTPS.'; return; }
  let registrationPromise;
  const register = () => registrationPromise ??= navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' }).catch(error => { registrationPromise = null; throw error; });
  register().then(registration => {
    const ready = () => { if (registration.waiting) status.textContent = 'An update is ready. Tap Check for updates to restart.'; };
    ready();
    registration.addEventListener('updatefound', () => installed(registration.installing).then(ready).catch(() => {}));
  }).catch(() => { status.textContent = 'Offline setup unavailable. Tap to retry.'; });
  button.addEventListener('click', async () => {
    button.disabled = true;
    status.textContent = 'Checking for updates…';
    try {
      if (!navigator.onLine) throw new Error('You are offline. Connect to check for updates.');
      const registration = await register();
      await registration.update();
      if (registration.installing) { status.textContent = 'Downloading update…'; await installed(registration.installing); }
      if (!registration.waiting) { status.textContent = 'You are up to date.'; return; }
      if (!saveWorld()) throw new Error('Could not save your world. Export it before updating.');
      status.textContent = 'World saved. Restarting…';
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => finish(new Error('Update is taking longer than expected. Tap to retry.')), 15000);
        function finish(error) { clearTimeout(timer); navigator.serviceWorker.removeEventListener('controllerchange', changed); error ? reject(error) : resolve(); }
        const changed = () => finish();
        navigator.serviceWorker.addEventListener('controllerchange', changed);
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      });
      if (!saveWorld()) throw new Error('Could not save your world. Export it before reloading.');
      location.reload();
    } catch (error) { status.textContent = error.message || 'Could not check for updates. Try again.'; }
    finally { button.disabled = false; }
  });
}
