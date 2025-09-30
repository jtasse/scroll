let video = null
let userPaused = false
let lastScrollY = window.scrollY
let rewindRAF = null

function rewindStep() {
	if (!video) return // safety check
	if (video.currentTime <= 0) {
		cancelAnimationFrame(rewindRAF)
		rewindRAF = null
		video.pause()
		return
	}
	video.currentTime -= 0.04 // rewind speed, tweak as needed
	rewindRAF = requestAnimationFrame(rewindStep)
}

document.addEventListener("DOMContentLoaded", () => {
	video = document.getElementById("myVideo") // Make sure this ID matches your video element!

	window.addEventListener("scroll", () => {
		const currentY = window.scrollY

		if (userPaused) {
			lastScrollY = currentY
			return
		}

		if (video) {
			if (currentY > lastScrollY) {
				// Scroll down → play forward
				if (rewindRAF) {
					cancelAnimationFrame(rewindRAF)
					rewindRAF = null
				}
				if (video.paused) video.play()
				video.playbackRate = 1
			} else if (currentY < lastScrollY) {
				// Scroll up → rewind
				if (!rewindRAF) {
					video.pause()
					rewindRAF = requestAnimationFrame(rewindStep)
				}
			}
		}

		lastScrollY = currentY
	})

	window.addEventListener("keydown", (e) => {
		if (e.code === "Space") {
			e.preventDefault()
			if (video) {
				if (video.paused) {
					userPaused = false
					video.play()
				} else {
					userPaused = true
					video.pause()
					if (rewindRAF) {
						cancelAnimationFrame(rewindRAF)
						rewindRAF = null
					}
				}
			}
		}
	})
})
