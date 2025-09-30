document.addEventListener("DOMContentLoaded", () => {
	const video = document.getElementById("myVideo")
	const soundToggle = document.getElementById("soundToggle")
	const playPauseToggle = document.getElementById("playPauseToggle")
	const soundHint = document.getElementById("soundHint")
	const scrubBar = document.getElementById("scrubBar")
	const scrubTime = document.getElementById("scrubTime")
	const timecodes = document.getElementById("timecodes")
	const timecodeStart = document.getElementById("timecodeStart")
	const timecodeEnd = document.getElementById("timecodeEnd")

	let hintFaded = false
	let isScrubbing = false
	let scrubTimeoutId = null

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
		e.stopPropagation()
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

	// Single keydown listener for spacebar (play/pause), 'M' (mute/unmute), and arrow keys (scrubbing)
	document.addEventListener("keydown", (e) => {
		if (e.code === "Space" || e.key === " ") {
			e.preventDefault()
			togglePlayPause()
		} else if (e.key.toLowerCase() === "m") {
			e.preventDefault()
			toggleMuteUnmute()
		} else if (e.code === "AudioVolumeMute") {
			e.preventDefault()
			toggleMuteUnmute()
		} else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
			e.preventDefault()
			handleArrowScrub(e.key)
		}
	})

	function handleArrowScrub(key) {
		const step = 5 // seconds to skip per key press
		let newTime = video.currentTime + (key === "ArrowRight" ? step : -step)
		newTime = Math.min(Math.max(newTime, 0), video.duration)
		video.currentTime = newTime

		showScrubUI(newTime)

		if (scrubTimeoutId) clearTimeout(scrubTimeoutId)
		scrubTimeoutId = setTimeout(() => {
			hideScrubUI()
		}, 1000)

		if (video.paused) {
			video.play().catch(() => {})
		}
	}

	// Update play/pause button classes based on video state
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

	// Toggle playback
	function togglePlayPause() {
		if (video.paused) {
			video.play().catch(() => {})
		} else {
			video.pause()
		}
	}

	// Update sound button text and classes
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

	// Update play/pause button on video events
	video.addEventListener("play", updatePlayPauseButton)
	video.addEventListener("pause", updatePlayPauseButton)

	// --- Scrubbing with live audio ---

	video.addEventListener("mousedown", (e) => {
		isScrubbing = true
		scrubVideo(e)
		video.style.cursor = "grabbing"

		if (scrubTimeoutId) clearTimeout(scrubTimeoutId)
	})

	window.addEventListener("mousemove", (e) => {
		if (!isScrubbing) return
		scrubVideo(e)
	})

	window.addEventListener("mouseup", () => {
		if (isScrubbing) {
			isScrubbing = false
			video.style.cursor = "default"
			hideScrubUI()

			// Play video from current position after scrubbing ends
			video.play().catch(() => {})
		}
	})

	// Helper to seek video based on mouse X position relative to video
	function scrubVideo(event) {
		const rect = video.getBoundingClientRect()
		let posX = event.clientX - rect.left
		posX = Math.min(Math.max(posX, 0), rect.width)
		const pct = posX / rect.width
		video.currentTime = pct * video.duration

		showScrubUI(video.currentTime)
	}

	function showScrubUI(currentTime) {
		const rect = video.getBoundingClientRect()
		const pct = currentTime / video.duration
		const barX = rect.left + pct * rect.width

		scrubBar.style.left = `${barX}px`
		scrubBar.style.top = `${rect.top}px`
		scrubBar.style.height = `${rect.height}px`
		scrubBar.style.display = "block"

		const minutes = Math.floor(currentTime / 60)
		const seconds = Math.floor(currentTime % 60)
		const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`

		scrubTime.textContent = timeStr
		scrubTime.style.left = `${barX}px`
		scrubTime.style.top = `${rect.top}px`
		scrubTime.style.display = "block"

		timecodes.style.display = "flex"
		timecodeStart.textContent = "00:00"
		timecodeEnd.textContent = formatTime(video.duration)
	}

	function hideScrubUI() {
		scrubBar.style.display = "none"
		scrubTime.style.display = "none"
		timecodes.style.display = "none"
	}

	function formatTime(seconds) {
		const m = Math.floor(seconds / 60)
		const s = Math.floor(seconds % 60)
		return `${m}:${s.toString().padStart(2, "0")}`
	}
})
