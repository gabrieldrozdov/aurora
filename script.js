/* Clock */
const body = document.querySelector('body');
const clock = document.querySelector(".clock")
const secondHand = document.querySelector(".second-hand");
const minsHand = document.querySelector(".min-hand");
const hourHand = document.querySelector(".hour-hand");
const pulse = document.querySelector('.pulse');
const digital = document.querySelector('.digital');
const audio = document.querySelector('.audio');
const realtime = document.querySelector('.realtime');
const overrides = document.querySelector('.overrides');
const favicon = document.querySelector("link[rel~='icon']");
let hourChange = true;
let songActive = false;
let time = '5pm';
let intros = ['9am','12pm','3pm','5pm','10pm'];
let music, intro;
let mute = true;
let override = false;
function setTime() {
	favicon.href = "./assets/meta/" + time + ".png";
	if (hourChange && !mute) {
		hourChange = false;
		transitionSong();
	}

    const now = new Date();
    const seconds = now.getSeconds();
    const secondsDegrees = ((seconds / 60) * 360) + 90;
    secondHand.style.transform = `rotate(${secondsDegrees}deg)`;

    const mins = now.getMinutes();
    const minsDegrees = ((mins / 60) * 360) + ((seconds / 60) * 6) + 90;
    minsHand.style.transform = `rotate(${minsDegrees}deg)`;
	
    const hour = now.getHours();
    const hourDegrees = ((hour / 12) * 360) + ((mins / 60) * 30) + 90;
    hourHand.style.transform = `rotate(${hourDegrees}deg)`;

	pulse.dataset.active = 0;
	setTimeout(() => {
		pulse.dataset.active = 1;
	}, 5)

	let midday = 'am';
	if (hour > 12) {
		midday = 'pm';
	}
	body.dataset.time = time;

	// Hour change
	let realHour = hour%12;
	if (realHour == 0) {
		realHour = 12;
	}
	if (time != realHour + midday && !override) {
		hourChange = true;
		time = realHour + midday;
		body.dataset.time = time;
		setActiveToggle();
	}
}
setTime();
setInterval(setTime, 1000);

// Mute controls
audio.addEventListener('click', toggleMute);
let context = (window.AudioContext || window.webkitAudioContext) ?
	new (window.AudioContext || window.webkitAudioContext)() : null;
let allowBackgroundPlayback = true; // default false, recommended false
let forceIOSBehavior = false; // default false, recommended false
let unmuteHandle;
function toggleMute() {
	audio.dataset.active = 0;
	overrides.dataset.active = 0;
	realtime.dataset.disabled = 1;
	if (!mute) {
		music.stop();
		audio.dataset.mute = 0;
		hourChange = true;
		mute = true;
		setTimeout(() => {
			audio.dataset.active = 1;
			overrides.dataset.active = 1;
			realtime.dataset.disabled = 0;
			if (override) {
				realtime.dataset.active = 1;
			}
			// if (unmuteHandle != null) {
			// 	unmuteHandle.dispose();
			// 	unmuteHandle = null;
			// }
		}, 1000)
	} else {
		Tone.start();
		audio.dataset.mute = 1;
		mute = false;
		if (context) {
			unmuteHandle = unmute(context, allowBackgroundPlayback, forceIOSBehavior);
		}
	}
}

// Transition between tracks (or start first track)
function transitionSong() {
	setActiveToggle();
	audio.dataset.active = 0;
	overrides.dataset.active = 0;
	realtime.dataset.disabled = 1;
	if (songActive) {
		songActive = false;
		music.stop();
		setTimeout(() => {
			songActive = true;
			music = new Tone.Player('assets/audio/'+time+".mp3").toDestination();
			music.loop = true;
			music.fadeOut = '1s';
			if (intros.includes(time)) {
				intro = new Tone.Player('assets/audio/'+time+"-intro.mp3", startMusic).toDestination();
				intro.autostart = true;
			} else {
				audio.dataset.active = 1;
				overrides.dataset.active = 1;
				if (override) {
					realtime.dataset.disabled = 0;
					realtime.dataset.active = 1;
				}
				music.autostart = true;
			}
		}, 2000)
	} else {
		songActive = true;
		music = new Tone.Player('assets/audio/'+time+".mp3").toDestination();
		music.loop = true;
		music.fadeOut = '1s';
		if (intros.includes(time)) {
			intro = new Tone.Player('assets/audio/'+time+"-intro.mp3", startMusic).toDestination();
			intro.autostart = true;
		} else {
			audio.dataset.active = 1;
			overrides.dataset.active = 1;
			if (override) {
				realtime.dataset.disabled = 0;
				realtime.dataset.active = 1;
			}
			music.autostart = true;
		}
	}
}

// For songs with intros
function startMusic() {
	setTimeout(() => {
		audio.dataset.active = 1;
		overrides.dataset.active = 1;
		if (override) {
			realtime.dataset.disabled = 0;
			realtime.dataset.active = 1;
		}
		music.start();
	}, intro.buffer.duration*1000)
}

// Override controls
for (let toggle of overrides.querySelectorAll('div')) {
	toggle.addEventListener('click', () => {
		changeTrack(toggle.dataset.time);
		setActiveToggle();
		showTime(toggle.dataset.time);
	});
	toggle.addEventListener('mouseenter', () => {
		showTime(toggle.dataset.time);
	});
	toggle.addEventListener('mouseleave', () => {
		hideTime();
	});
}
function changeTrack(newTime) {
	override = true;
	realtime.dataset.active = 1;
	time = newTime;
	body.dataset.time = time;
	if (songActive && !mute) {
		transitionSong();
	}
}
function showTime(newTime) {
	digital.dataset.active = 1;
	clock.dataset.active = 0;
	digital.innerText = newTime;
}
function hideTime() {
	digital.dataset.active = 0;
	clock.dataset.active = 1;
}

// Set active toggle
function deactivateToggles() {
	for (let toggle of overrides.querySelectorAll('div')) {
		toggle.dataset.active = 0;
	}
}
function setActiveToggle() {
	deactivateToggles();
	let activeTime = document.querySelector(`.overrides div[data-time="${time}"]`);
	activeTime.dataset.active = 1;
}
setActiveToggle();

// Return to realtime
realtime.addEventListener('click', resetClock);
function resetClock() {
	realtime.dataset.active = 0;
	audio.dataset.active = 0;
	if (!mute) {
		overrides.dataset.active = 0;
	} else {
		setTimeout(() => {
			audio.dataset.active = 1;
		}, 1000)
	}
	override = false;
}

// Prevent phone from falling asleep with wake lock API
let wakeLock = null;

// Function that attempts to request a screen wake lock.
const requestWakeLock = async () => {
	try {
		wakeLock = await navigator.wakeLock.request();
		wakeLock.addEventListener('release', () => {
			console.log('Screen Wake Lock released:', wakeLock.released);
		});
		console.log('Screen Wake Lock released:', wakeLock.released);
	} catch (err) {
		console.error(`${err.name}, ${err.message}`);
	}
};

// Request a screen wake lock…
requestWakeLock();
// …and release it again after 5s.
// window.setTimeout(() => {
// 	wakeLock.release();
// 	wakeLock = null;
// }, 5000);

// Detect if tab is navigated away from
document.addEventListener("visibilitychange", (event) => {
	if (document.visibilityState == "visible") {
		console.log("tab is active")
	} else {
		console.log("tab is inactive")
	}
});