const video = document.getElementById('demoVideo');
const narrationAudio = document.getElementById('narrationAudio');
const startOverlay = document.getElementById('startOverlay');
const startButton = document.getElementById('startButton');
const replayButton = document.getElementById('replayButton');
const toggleNarrationButton = document.getElementById('toggleNarrationButton');
const toggleVideoMuteButton = document.getElementById('toggleVideoMuteButton');
const captionText = document.getElementById('captionText');
const voiceStatus = document.getElementById('voiceStatus');
const pulseDot = document.getElementById('pulseDot');

const narrationCues = [
  {
    start: 0,
    end: 18,
    caption: 'AIonOS starts with the live vessel plan and converts it into an operational decision layer for the berth.',
  },
  {
    start: 18,
    end: 39,
    caption: 'The agent calculates berth position using quay length, draft limits, tidal clearance, mooring boundaries, berth window, and yard-flow constraints.',
  },
  {
    start: 39,
    end: 62,
    caption: 'The objective is not only to park the vessel; it is to reduce crane travel, truck congestion, and berth productivity risk.',
  },
  {
    start: 62,
    end: 84,
    caption: 'The crane planning layer evaluates reach, bay coverage, working radius, separation distance, workload balance, and interference risk.',
  },
  {
    start: 84,
    end: 103,
    caption: 'When berth timing, crane availability, or bay sequence changes, the twin recalculates alternatives and recommends a revised plan.',
  },
  {
    start: 103,
    end: 123,
    caption: 'The result is a control-tower view connecting vessel position, crane deployment, yard readiness, and real-time execution.',
  },
];

let currentCueIndex = -1;
let narrationEnabled = true;
let userStarted = false;

function updateCue(force = false) {
  const time = narrationAudio.currentTime || video.currentTime;
  const nextIndex = narrationCues.findIndex(cue => time >= cue.start && time < cue.end);

  if (nextIndex === -1) return;
  if (!force && nextIndex === currentCueIndex) return;

  currentCueIndex = nextIndex;
  captionText.textContent = narrationCues[nextIndex].caption;
  pulseDot.style.background = narrationEnabled ? 'var(--accent-3)' : '#8796ac';
}

function syncVideoToNarration() {
  if (!narrationEnabled || !video.duration) return;

  const expectedVideoTime = narrationAudio.currentTime % video.duration;
  const drift = Math.abs(video.currentTime - expectedVideoTime);
  if (drift > 0.45) {
    video.currentTime = expectedVideoTime;
  }
}

async function startExperience() {
  userStarted = true;
  startOverlay.classList.add('hidden');

  narrationAudio.currentTime = 0;
  video.currentTime = 0;

  try {
    await Promise.all([video.play(), narrationAudio.play()]);
    voiceStatus.textContent = 'Narration status: MP3 playback active';
  } catch {
    voiceStatus.textContent = 'Narration status: click replay if playback was blocked';
  }

  updateCue(true);
}

async function replayNarration() {
  currentCueIndex = -1;
  narrationAudio.currentTime = 0;
  video.currentTime = 0;

  try {
    await Promise.all([video.play(), narrationAudio.play()]);
    voiceStatus.textContent = 'Narration status: MP3 playback active';
  } catch {
    voiceStatus.textContent = 'Narration status: manual playback may be required';
  }

  updateCue(true);
}

function toggleNarration() {
  narrationEnabled = !narrationEnabled;

  if (!narrationEnabled) {
    narrationAudio.pause();
    toggleNarrationButton.textContent = 'Resume narration';
    voiceStatus.textContent = 'Narration status: paused';
    captionText.textContent = 'Narration paused. Video continues inline.';
    pulseDot.style.background = '#8796ac';
    return;
  }

  toggleNarrationButton.textContent = 'Pause narration';
  voiceStatus.textContent = 'Narration status: MP3 playback active';
  narrationAudio.currentTime = video.currentTime;
  narrationAudio.play().catch(() => {});
  updateCue(true);
}

function toggleVideoMute() {
  video.muted = !video.muted;
  toggleVideoMuteButton.textContent = video.muted ? 'Keep video muted' : 'Mute video audio';
}

startButton.addEventListener('click', startExperience);
replayButton.addEventListener('click', replayNarration);
toggleNarrationButton.addEventListener('click', toggleNarration);
toggleVideoMuteButton.addEventListener('click', toggleVideoMute);

narrationAudio.addEventListener('timeupdate', () => {
  if (!userStarted || !narrationEnabled) return;
  syncVideoToNarration();
  updateCue(false);
});

narrationAudio.addEventListener('ended', () => {
  if (!userStarted || !narrationEnabled) return;
  narrationAudio.currentTime = 0;
  narrationAudio.play().catch(() => {});
});

video.addEventListener('timeupdate', () => {
  if (!userStarted || narrationEnabled) return;
  updateCue(false);
});

narrationAudio.addEventListener('loadedmetadata', () => {
  captionText.textContent = `Ready to begin the ${Math.round(narrationAudio.duration)}-second narrated walkthrough.`;
  voiceStatus.textContent = 'Narration status: ready (repo MP3)';
});
