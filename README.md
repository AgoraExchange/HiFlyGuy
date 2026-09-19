# HiFlyGuy

A local, interactive 3D virtual pet inspired by the supplied fly simulation references. FlyGuy explores a habitat, reacts to nearby objects, eats, and rests. Built with Three.js and Vite; no account or backend required.

## iPhone app and GitHub Pages

Published address: https://agoraexchange.github.io/HiFlyGuy/

Once Pages is enabled, open that address in Safari, tap Share, then Add to Home Screen (enable Open as Web App if shown). Open it online once to download the offline app. The market terminal and web fonts need internet access; the habitat works offline with fallback fonts.

At the bottom of the page, tap **Check for updates**. When a new deployment is available, it downloads the new app, saves the current world, activates the update, and restarts. There is no need to remove or reinstall the home-screen icon. Updates do not clear local storage. If saving fails, the app refuses to restart and asks you to export your world first.

Worlds are saved on each device/browser; the phone does not automatically share your desktop world. Removing website data can erase that device's world.

### Deploy changes

In repository Settings > Pages, select **GitHub Actions** as the source once. The Deploy HiFlyGuy workflow builds and publishes each push to main. If the first run happened before Pages was enabled, rerun it from the Actions tab.

The production build uses relative paths, a scoped manifest, and a service worker with a content-based release identifier. Only this app's caches are managed; other apps on the same GitHub Pages domain are untouched. Development mode does not register a service worker.

Run npm test for the simulation tests and npm run test:pwa for a production browser check of the project subpath, mobile layout, updates, save retention, and offline reopening. The browser test defaults to Chrome on this Windows machine; set CHROME_PATH for another executable.

## Open the website

Double-click **Start HiFlyGuy.cmd**. It starts a hidden local development server and opens your browser at **http://127.0.0.1:5180**. Keep this project folder in place while the server is running.

Or run these commands from this folder:

```powershell
npm install
npm run dev
```

Dependencies are already installed on this machine. Use Node.js 22.12+ (tested with 24.15). WebGL and browser hardware acceleration are needed. The server listens on your own machine only. To stop a server started by the launcher, run `Stop HiFlyGuy.ps1` in PowerShell. A server started in a terminal can be stopped with Ctrl+C.

## Play

- Drag the habitat to orbit; scroll or pinch to zoom. Right-drag to pan.
- Use the focus icon for a close-up camera that follows FlyGuy.
- In the neural activity panel, drag the particles to rotate and scroll or pinch to zoom in. Click **Illustrative Map** to smoothly restore the full-map view, even while the simulation is paused.
- Select a ripe banana, fresh tomato, or peppermint candy, then click the floor. The “Place near FlyGuy” button provides a keyboard-accessible alternative.
- The model treats banana as a strong food scent, tomato as a weaker one, and peppermint as aversive. These are demo parameters, not biological findings about those exact objects.
- Toggle scent fields with the wavy-lines button. Up to eight objects can be present in each room.
- Fullscreen includes a six-slot inventory: banana, tomato, peppermint, Fly Swatter, and two empty slots. Click a slot or press 1, 2, 3, or 4, then click the floor inside the circle. Escape cancels placement.
- Click a placed object to select it. A bright ring highlights it and a trash button appears underneath the fullscreen button. Click trash or press Delete to remove it. Clicking empty floor deselects; dragging the camera does not select objects.
- FlyGuy learns caution about peppermint locations he actually encounters. Dashed lavender circles show those areas; the brain button in the scene toolbar toggles them. The “Learning his world” panel shows encounters and memory strength.
- Removing peppermint (or clearing objects) keeps learned memories. Repeated unpleasant visits strengthen them; time and safe visits weaken them. Attractive food can draw a hungry fly back into an area where the peppermint was removed. These are illustrative learning rules, not scientific predictions.
- Pause with the playback button or Space; choose ½×, 1×, or 2× time. Escape cancels placement.
- Open the experiment log to export the current session as JSON. The world autosaves locally every two seconds and after object, pause, speed, and reset changes. Reloading or reopening in the same browser resumes the saved world.
- Reset world starts a new session and clears objects and history. Orbit and zoom still work while time is paused.
- Reset also clears learned memories. Session exports include spatial memory records. Reset replaces the saved world; refreshing resumes it.

Feeding includes animated foreleg rubbing, mouth movement, and a subtle body bob. During exploration, FlyGuy occasionally lands for a six-second grooming break with a distinct foreleg and face-cleaning motion. Food and threats can interrupt the break. These are stylized animations.

## Fly Swatter

Select slot 4 in the fullscreen inventory, press 4, or use the Fly Swatter card below the food cards. Move the mouse over the habitat, or drag a finger on the habitat, to guide the 3D swatter. Camera orbit is temporarily disabled while the tool is equipped. Escape, the Put away button, or selecting food puts it away. Moving the pointer outside the habitat or lifting a finger removes the active swatter.

The swatter moves at at most 2.4 simulation units per second. FlyGuy detects it nearby and escapes at 5.4 units per second, immediately interrupting feeding, grooming, or rest. Escape steering chooses routes that stay inside the habitat, including around the boundary. A separation limit prevents the swatter from touching him; there is no hit, injury, or death mechanic. Low energy never disables his escape.

The Panicking label, orange selection ring, distress indicator, and live model signals react during a chase. Distress fades after the swatter leaves. This is an authored virtual-pet response. Unlike stationary peppermint, the moving swatter does not add a remembered location. It does not use any of the eight placed-object slots. Pause freezes motion, and the pointer tool is put away after a reload while the world and transient mood are restored.

## Apartment life

The viewing order is **Habitat ? Fire escape ? Night desk ? Bar ? Rooftop ? Playground**. These scenes are procedural Three.js environments based on the supplied bedroom, fire escape, bar, and rooftop references.

- **Habitat:** a bed, pillow, deforming blanket, bedside lamp, and light through blinds. Tidiness changes gradually with care and motivation. A tired fly sleeps; a motivated fly makes the bed. Low spirits and drinks affect his posture.
- **Fire escape:** steel grating, rails, an apartment window, and stairs. FlyGuy chooses smoke breaks with a held cigarette, glowing ember, and drifting smoke, then may go back inside.
- **Bar:** warm pendant lighting, bottles, stools, and an unlimited supply of drinks. He holds and raises a glass, may order again, and becomes visibly tipsy before deciding to move on.
- **Rooftop:** a water tank, stairwell, parapet, outlined city, suspension bridge, and night sky. He can settle near the edge to watch the city.

Room tabs are observation cameras. The lit dot marks his actual room. **Find FlyGuy** jumps your camera to him; **Invite here** requests a physical trip through connected rooms. **Stay with me** delays new trips for two simulation minutes. **Free will: off** prevents new autonomous routines while an existing routine or trip finishes; invitations still work. Playground practice keeps him available for lessons.

Mood, motivation, stress, tidiness, habits, tipsiness, current routine, route, and viewed room save locally with the existing pet state. Pausing freezes the whole life; there is no offline progression. Old saves migrate without clearing food or training. Items and peppermint memories stay in their own rooms, and Clear objects affects only the room you are viewing.

These are fictional character routines and virtual-pet variables, not predictions of fly biology, substance effects, or consciousness. The synthetic neural display remains clearly identified as illustrative.

## Night desk

Click or tap the market button on the laptop itself to switch between BTC/USD, ETH/USD, XMR/USD (Kraken), Apple, and NVIDIA. The menu works directly in the 3D scene and in fullscreen; dragging still orbits the camera. Screen clicks respect the laptop's orientation and foreground objects. The enlarged terminal shares the same selected market. BTC, ETH, and XMR are cryptocurrencies.

Use **03 Night desk** to view the computer environment: a laptop, cyan desk lights, speakers, a tower, a mug, and a night window. Room tabs change the camera, not FlyGuy's location. If he is elsewhere, **Invite here** asks him to travel to the desk. Each room retains its own objects and memories; all rooms share one saved life. Reset begins again in the bedroom.

**Watching enabled** lets FlyGuy approach a spot in front of the laptop, land, and face the screen. Toggle it off for free roaming. Feeding, low energy, grooming, peppermint, and swatter escape retain their priorities. Watching is an authored activity, not market comprehension, financial prediction, or a trained policy. The market feed does not drive the neural controller.

The laptop shows TradingView's [official free Advanced Chart widget](https://www.tradingview.com/widget-docs/widgets/charts/advanced-chart/), initially BITSTAMP:BTCUSD. **Open terminal** enlarges the same screen for interaction, including in fullscreen. Choose BTC, ETH, Apple, or NVIDIA, or use TradingView's symbol controls. The display includes source attribution, an external chart link, and actual virtual-pet telemetry in a separate footer. TradingView supplies the chart; availability and data delays depend on its markets and services. No API key or brokerage account is used. No trades can be placed by FlyGuy.

External internet access to TradingView is required. A failed script request or a 15-second loading timeout shows an unavailable message and a reconnect button; no prices are fabricated. The cross-origin widget manages its own market/data errors after loading. Market connection failure never resets the simulation. The embed loads only after the desk is first opened. `public/market.html` is also copied into production builds. `src/computer-room.js` combines a procedural Three.js desk with a CSS3D screen and a depth-writing transparent plane so FlyGuy and other geometry can occlude the chart.

## Playground and bonding

**Practice with me** calls FlyGuy to a greeting spot in front of your holographic YOU marker. He lands facing you, then waits for **Give a treat**. **Come to me** tests the learned cue without guidance; his recall skill and Bond affect willingness and response time. These buttons always target you, regardless of the currently selected pad. You can also choose **Me (YOU marker)** in the destination menu. Personal visits are labeled separately in practice history and share the existing recall skill and reward rules. Active visits and their reward windows survive reloads.

Choose **06 Playground**, then **Invite here** if FlyGuy is elsewhere, for three raised landing pads, a play arch, and a holographic human marker labeled YOU. FlyGuy can visit and land on the pads on his own. Click a pad or choose it in the training menu, then:

1. Choose **Practice call**. He listens, approaches the selected pad, and lands.
2. Click **Give a treat** within 12 simulation seconds after completion. This reinforces the cue and raises Bond. Merely pressing a cue or reward button does not earn progress.
3. Try **Call FlyGuy** without guidance to test his learned response. Repeat rewarded practice to make responses quicker and more reliable.
4. At 25% Bond and 30% recall, **Practice flip** unlocks. Early attempts are little tumbles. At 55% flip skill, he can perform a full **Backflip!** A normal cue can still be declined; guided practice provides a reliable way to teach it.

The Bond bar starts at 12%. A timely training reward adds 5.5 percentage points of bond and updates the practiced skill by 22% of its remaining gap to mastery. Skill affects hesitation, recall speed, and cue acceptance; bond also affects cue acceptance. Eating user-placed food slowly builds familiarity. Nearby swatter scares reduce bond. Time away does not punish the relationship. A recent-practice history distinguishes attempts, misses, completions, rewards, and interruptions, including completion times. The UI displays the current cue response probability; it is a model estimate, not a measured success rate.

Needs and safety take precedence: feeding, rest, aversion, or panic can interrupt a lesson. Repeated clicks cannot stack lessons or rewards. Pausing freezes the lesson and reward countdown. End lesson cancels the current turn. Switching environments preserves learned bond and skills; Reset world clears them. Training progress, active attempts, and reward windows are validated and saved alongside the world. Older saves receive default training values. The training panel works in fullscreen and can be collapsed with **Training & bond**.

This is an authored virtual-pet reinforcement model in `src/training.js`, separate from the synthetic rate network and FlyWire. The stored skill values change future behavior because of rewards. Bond is a game relationship mechanic; the human marker is a visible cue source, not evidence that FlyGuy perceives a person, has subjective experience, or thinks he is alive. The animations and landing geometry are stylized.

## World recovery

Automatic Vite refreshes are disabled on the play server, so editing source files will not reset a live world. Refresh manually to load code changes. Local autosaves include the fly position, hunger, energy, remaining food, neural state, random generator state, memories, log, pause state, and speed. Time does not advance while the page is closed. Camera positions and the short live chart history start fresh after a reload.

The top status reads WORLD SAVED, or SAVE UNAVAILABLE if browser storage is blocked or full. Closing unexpectedly can lose up to the latest two seconds. Corrupt or incompatible saves are ignored safely. Clearing site data removes the save. Saves created before autosaving was added cannot be recovered.

## What is actually simulated

`src/simulation.js` runs a deterministic, fixed-step rate network with **192 synthetic units and 768 generated recurrent edges**. Four populations process attraction, aversion, motor drive, and feeding reward. Distance-dependent scent inputs and internal state drive these populations. Their outputs participate in behavior selection, and a separate hand-authored steering controller moves the body.

The body is an original procedural mesh with six articulated legs, two animated veined wings, antennae, bristles, segmented abdomen, and compound-eye detail. Space uses arbitrary simulation units. The wing motion is a visual animation, not a physical flight model. The floor, object collisions, food consumption, hunger, and energy are simplified.

The habitat ring now has radius 11 (previously about 9). Object placement and movement share circular bounds, with a margin for the fly and objects. The floor grid is slightly brighter.

Food seeking uses separate hunger thresholds: meals end at 12% hunger (once energy is at least 48%); appetite returns at 40% hunger or below 25% energy. This prevents repeatedly switching between food seeking and exploring around one threshold.

Spatial memory is a separate, bounded associative layer, not synaptic plasticity in the synthetic rate network. Up to 32 learned locations store exposure strength and distinct encounter counts. Repeated nearby peppermint exposure reinforces a location; distance-weighted recall affects route selection, steering, and landing. Memory decays over simulation time and weakens during safe visits, especially feeding. It persists after object removal and across reloads through the local autosave; Reset world clears it. The visible circles indicate an approximate influence area, not a hard barrier.

The neural visualization is a **procedurally generated, illustrative brain-shaped point cloud** colored using the model signals. Its 5,400 display points do not represent the 192 controller units one-to-one. It is not a scientific anatomical reconstruction, a real scan, a spike raster, or recorded activity. The chart shows normalized model response, not biological Hz.

**No FlyWire connectivity, neuron morphology, or synapse dataset is loaded. This version does not emulate a whole fly brain or establish consciousness.** This distinction is also available in the site's “About this world” panel.

## FlyWire resources and a future data-backed version

Sources inspected September 11, 2026:

- [FlyWire Codex](https://codex.flywire.ai/) — atlas and data explorer. Lists FAFB v783 with 139,255 neurons. Interactive exploration requires Google sign-in.
- [FlyWire connectivity data on Zenodo](https://zenodo.org/records/10676866) — canonical public connectivity releases; individual-synapse downloads can be multiple gigabytes. No large downloads are included here.
- [A Drosophila computational brain model reveals sensorimotor processing](https://www.nature.com/articles/s41586-024-07763-9) — an example of combining connectome weights and neurotransmitter predictions with a computational model.

A concrete next phase is to select a documented sensory circuit subset, retain real neuron IDs, weights and transmitter annotations, add a reproducible dataset-preparation script with attribution and release/license metadata, and calibrate the controller against published responses. Importing a wiring diagram alone does not supply a validated sensory system, neural dynamics, motor control, or living animal. Full brain/body simulation is a separate research and compute effort.

This is an independent project, unaffiliated with FlyWire, Princeton, or the Fly Guy books. The three original reference JPEGs remain in the project folder as visual references and are not displayed as product artwork.

## Development and checks

```powershell
npm run dev
npm run build
npm run preview
npm test
npm run test:e2e
```

`npm test` verifies food seeking/feeding, avoidance, freeze/reset, bounds, finite state over a ten-minute simulation, and object limits. Browser tests verify rendering, pause, interactions, responsive layout, orbiting, direct placement, and JSON export. The browser test configuration uses the installed Chrome on this Windows machine; change `executablePath` for another machine or use Playwright's installed Chromium. Screenshots are generated under `test-results/`.

Production files are written to `dist/`. Serve them through an HTTP server; opening `index.html` via `file://` will not load module assets correctly. No deployment has been performed.

### File map

| File | Purpose |
| --- | --- |
| `src/main.js` | Interface, controls, telemetry, session export |
| `src/scene.js` | Fly, food models, habitat, orbit camera, illustrative brain |
| `src/simulation.js` | Model, state, movement and behavior |
| `src/life.js` | Connected rooms, autonomous routines, care and habit state |
| `src/life-scenes.js` | Bedroom, fire escape, bar, rooftop and animated props |
| `src/life.css` | Six-room controls and responsive life interface |
| `src/session.js` | Validated local autosave and world recovery |
| `src/style.css` | Responsive visual design |
| `vite.config.js` | Local server and production build |

The native Vite config loader and disabled dependency prebundling avoid ancestor-directory access problems in this machine's restricted workspace. JavaScript dependencies are bundled locally. The optional Google Fonts stylesheet falls back to local sans-serif fonts when offline.

### Director lab take

Enable Directors Mode, open Actions, and choose **PROFIT IS MANDATORY**. Start screen recording before selecting the action: a two-second lead-in precedes the 24-second vertical take. The staged loss is fictional and does not change the portfolio or saved world. Escape or a double-tap stops filming; Replay repeats the same choreography.

The silent scene is intended for an edit to **Locrian Dominant by Aloboi**; add the song in your video editor. Timing is not yet synced to a specific song excerpt. Relative to the end of the lead-in: loss 0–4s, isolation 4–8s, interrogation 8–12s, electrical correction 12–18s, aftermath 18–24s. The three electrical pulses begin at 12.5s, 14.5s, and 16.5s. Adjust `src/director-lab-timeline.js` to retime the scene.
