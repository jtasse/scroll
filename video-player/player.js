const video = document.getElementById("myVideo")
const soundToggle = document.getElementById("soundToggle")
const playPauseToggle = document.getElementById("playPauseToggle")
const soundHint = document.getElementById("soundHint")
let hintFaded = false

// IntersectionObserver for scroll-to-play
const observer = new IntersectionObserver(
	(entries) => {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				video.play().catch((err) => {
					console.warn("Autoplay prevented:", err)
				})
			} else {
				video.pause()
			}
		})
	},
	{ threshold: 0.5 }
)

observer.observe(video)

// Initialize buttons' states
updateSoundButton()
updatePlayPauseButton()

// Sound toggle button click
soundToggle.addEventListener("click", (e) => {
	e.stopPropagation() // prevent triggering document click
	toggleMuteUnmute()
})

// Play/pause toggle button click
playPauseToggle.addEventListener("click", (e) => {
	e.stopPropagation()
	togglePlayPause()
})

// Pause/resume video on left click anywhere except the sound or play/pause buttons
document.addEventListener("click", (e) => {
	if (e.target !== soundToggle && e.target !== playPauseToggle) {
		togglePlayPause()
	}
})

// Single keydown listener for spacebar (play/pause) and 'M' (mute/unmute)
document.addEventListener("keydown", (e) => {
	// Prevent scrolling on spacebar
	if (e.code === "Space" || e.key === " ") {
		e.preventDefault()
		togglePlayPause()
	} else if (e.key.toLowerCase() === "m") {
		e.preventDefault()
		toggleMuteUnmute()
	}
	// Optional: try to detect media keys (may not work reliably)
	else if (e.code === "AudioVolumeMute") {
		e.preventDefault()
		toggleMuteUnmute()
	}
})

// Update Play/Pause button text based on video state
function updatePlayPauseButton() {
	if (video.paused) {
		playPauseToggle.textContent = "▶️ Play"
	} else {
		playPauseToggle.textContent = "⏸️ Pause"
	}
}

// Toggle playback on button or other triggers
function togglePlayPause() {
	if (video.paused) {
		video.play().catch(console.warn)
	} else {
		video.pause()
	}
}

// Update sound button text and class
function updateSoundButton() {
	if (video.muted) {
		soundToggle.textContent = "🔇 Sound Off"
		soundToggle.classList.add("sound-off")
		soundToggle.classList.remove("sound-on")
		soundHint.textContent = "⇦ Click or press 'M' to unmute"
	} else {
		soundToggle.textContent = "🔊 Sound On"
		soundToggle.classList.add("sound-on")
		soundToggle.classList.remove("sound-off")
		soundHint.textContent = "⇦ Click or press 'M' to mute"
	}
}

// Fade out the sound hint after first toggle
function fadeOutSoundHint() {
	if (!hintFaded) {
		hintFaded = true
		soundHint.classList.add("fade-out")
	}
}

// Toggle mute/unmute and update UI + fade hint
function toggleMuteUnmute() {
	video.muted = !video.muted
	updateSoundButton()
	fadeOutSoundHint()
}

function updatePlayPauseButton() {
	if (video.paused) {
		playPauseToggle.classList.add("paused")
		playPauseToggle.classList.remove("playing")
		playPauseToggle.setAttribute("aria-label", "Play")
	} else {
		playPauseToggle.classList.add("playing")
		playPauseToggle.classList.remove("paused")
		playPauseToggle.setAttribute("aria-label", "Pause")
	}
}

// Initialize button on page load with paused style:
updatePlayPauseButton()

// Update play/pause button whenever video state changes
video.addEventListener("play", updatePlayPauseButton)
video.addEventListener("pause", updatePlayPauseButton)

let isScrubbing = false

video.addEventListener("mousedown", (e) => {
	isScrubbing = true
	// Don't pause, keep playing to hear audio changes live
	seekVideo(e)
	video.style.cursor = "grabbing"
})

window.addEventListener("mousemove", (e) => {
	if (!isScrubbing) return
	seekVideo(e)
})

window.addEventListener("mouseup", () => {
	if (isScrubbing) {
		isScrubbing = false
		video.style.cursor = "default"
		// No need to play() because video was never paused
	}
})

function seekVideo(event) {
	const rect = video.getBoundingClientRect()
	let posX = event.clientX - rect.left
	posX = Math.min(Math.max(posX, 0), rect.width)
	const pct = posX / rect.width
	video.currentTime = pct * video.duration
}
