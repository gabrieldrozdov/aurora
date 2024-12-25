const body = document.querySelector('body');
const clock = document.querySelector(".clock")
const secondHand = document.querySelector(".second-hand");
const minsHand = document.querySelector(".min-hand");
const hourHand = document.querySelector(".hour-hand");
const digital = document.querySelector('.digital');
const realtime = document.querySelector('.realtime');
const overrides = document.querySelector('.overrides');
const favicon = document.querySelector("link[rel~='icon']");
const audioLoop = document.querySelector("#loop");

/* Clock */
let hourChange = true;
let songActive = false;
let time = `${Math.floor(Math.random()*12+1)}`;
if (Math.random() < .5) {
	time = time+"am";
} else {
	time = time+"pm";
}
body.dataset.time = time;
let music;
let override = false;
let firsttime = true;
function setTime() {
	favicon.href = "./assets/meta/" + time + ".png";
	if (hourChange && intro == false) {
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
		forceChange = false;
	}
}
setInterval(setTime, 1000);
setTimeout(setTime, 50);

// Transition between tracks (or start first track)
function transitionSong() {
	hideTime();
	setActiveToggle();
	overrides.dataset.active = 0;
	realtime.dataset.disabled = 1;
	if (songActive) {
		if (window.innerWidth > 600) {
			songActive = false;
			fadeAudio();
			setTimeout(() => {
				songActive = true;
				loaded = false;
				playLoop();
			}, 2100)
		} else {
			loaded = false;
			playLoop();
		}
	} else {
		songActive = true;
		loaded = false;
		playLoop();
	}
}

// Play music
let loaded = false;
function playLoop() {
	audioLoop.volume = 1;

	if (!loaded) {
		audioLoop.src = `assets/audio/${time}.mp3`;
	}
	audioLoop.play();
	overrides.dataset.active = 1;
	if (override) {
		realtime.dataset.disabled = 0;
		realtime.dataset.active = 1;
	}
}

// Fade out and stop current loop
function fadeAudio() {
	if (window.innerWidth > 600) {
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
	} else {
		this.stop();
	}
}
audioLoop.addEventListener('timeupdate', function () {
	var buffer = .44;
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
	if (songActive) {
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
	override = false;
}

// Intro handshake
let intro = true;
const handshake = document.querySelector("#handshake");
function initialize() {
	intro = false;
	hourChange = false;
	handshake.dataset.active = 0;
	clock.dataset.active = 1;
	overrides.dataset.active = 1;
	transitionSong();
}
handshake.addEventListener('click', initialize);