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

const MAX_VIDEO_ROUNDS = 2;

const narrationCues = [
  {
    start: 0,
    end: 14,
    caption: 'AIonOS ingests the vessel plan and opens a berth decision layer for the shift supervisor.',
  },
  {
    start: 14,
    end: 29,
    caption: 'The agent places the vessel using quay length, draft, tidal clearance, mooring limits, and yard-flow timing.',
  },
  {
    start: 29,
    end: 44,
    caption: 'Crane assignment is validated against reach, bay coverage, crane separation, and interference risk.',
  },
  {
    start: 44,
    end: 58,
    caption: 'When timing or crane availability changes, the twin recalculates and recommends the best updated plan.',
  },
];

let currentCueIndex = -1;
let narrationEnabled = true;
let userStarted = false;
let completedVideoRounds = 0;

function updateCue(force = false) {
  const time = narrationEnabled ? narrationAudio.currentTime : video.currentTime;
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

function stopExperience() {
  video.pause();
  narrationAudio.pause();
  voiceStatus.textContent = `Narration status: completed after ${MAX_VIDEO_ROUNDS} video rounds`;
  captionText.textContent = 'Demo complete. Click replay to run the shortened walkthrough again.';
  pulseDot.style.background = '#8796ac';
}

async function startExperience() {
  userStarted = true;
  startOverlay.classList.add('hidden');
  completedVideoRounds = 0;

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
  completedVideoRounds = 0;
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
  voiceStatus.textContent = 'Narration status: completed';
});

video.addEventListener('ended', () => {
  if (!userStarted) return;

  completedVideoRounds += 1;
  if (completedVideoRounds >= MAX_VIDEO_ROUNDS) {
    stopExperience();
    return;
  }

  video.currentTime = 0;
  video.play().catch(() => {});
});

video.addEventListener('timeupdate', () => {
  if (!userStarted || narrationEnabled) return;
  updateCue(false);
});

narrationAudio.addEventListener('loadedmetadata', () => {
  captionText.textContent = `Ready to begin the ${Math.round(narrationAudio.duration)}-second narrated walkthrough.`;
  voiceStatus.textContent = 'Narration status: ready (repo MP3)';
});
