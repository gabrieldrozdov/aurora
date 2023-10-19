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
const audioIntro = document.querySelector("#intro");
const audioLoop = document.querySelector("#loop");

/* Clock */
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
	if (hour >= 12) {
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
function toggleMute() {
	audio.dataset.active = 0;
	overrides.dataset.active = 0;
	realtime.dataset.disabled = 1;
	if (!mute) {
		fadeAudio();
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
		}, 2000)
	} else {
		audio.dataset.mute = 1;
		mute = false;
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
		fadeAudio();
		setTimeout(() => {
			songActive = true;
			if (intros.includes(time)) {
				playIntro();
			} else {
				playLoop();
			}
		}, 2000)
	} else {
		songActive = true;
		if (intros.includes(time)) {
			playIntro();
		} else {
			playLoop();
		}
	}
}

// Play music
function playLoop() {
	console.log('loop');
	audioLoop.volume = 1;
	audioLoop.src = `assets/audio/${time}.mp3`;
	audioLoop.play();
	audio.dataset.active = 1;
	overrides.dataset.active = 1;
	if (override) {
		realtime.dataset.disabled = 0;
		realtime.dataset.active = 1;
	}
}
function playIntro() {
	console.log('intro');
	activeIntro = true;
	audioIntro.src = `assets/audio/${time}-intro.mp3`;
	audioIntro.play();
	audioIntro.addEventListener('timeupdate', introTransition);
}
function introTransition() {
	if (activeIntro) {
		var buffer = 0.2;
		if(audioIntro.currentTime > audioIntro.duration - buffer){
			playLoop();
			activeIntro = false;
			audioIntro.removeEventListener('timeupdate', introTransition);
		}
	}
}

// Fade out and stop current loop
function fadeAudio() {
	let fade = setInterval(function () {
		if (audioLoop.volume > 0) {
			let temp = audioLoop.volume;
			temp -= .1;
			let newVolume = Math.round(temp * 10) / 10;
			audioLoop.volume = newVolume;
		}
		if (audioLoop.volume <= 0) {
			clearInterval(fade);
			this.stop();
		}
	}, 200);
}
audioLoop.addEventListener('timeupdate', function () {
	var buffer = 0.1;
	if(this.currentTime > this.duration - buffer){
		this.currentTime = 0
		this.play()
	}
});

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
	overrides.dataset.active = 0;
	audio.dataset.active = 0;
	if (mute) {
		setTimeout(() => {
			overrides.dataset.active = 1;
			audio.dataset.active = 1;
		}, 1000)
	}
	override = false;
}

// Prevent phone from falling asleep with wake lock API
let wakeLock = null;
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
requestWakeLock();

// Detect if tab is navigated away from
document.addEventListener("visibilitychange", (event) => {
	if (document.visibilityState == "visible") {
		requestWakeLock();
	} else {
		wakeLock.release();
		wakeLock = null;
	}
});