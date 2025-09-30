const audioContext = new (window.AudioContext || window.webkitAudioContext)()
let forwardBuffer = null
let reversedBuffer = null
let lastScrollY = window.scrollY
const globalVolume = 0.4
let userHasInteracted = false

let arrow = null
let arrowOffsetX = 0
let scrollDirection = 0 // 1 = right, -1 = left, 0 = stop
let animationFrameId = null
let scrollTimeoutId = null

let arrowX = 0 // Track horizontal position in pixels
const arrowStep = 10 // Adjust this value for speed per scroll
const soundFile = "../assets/devils_water.wav"

// Load and decode audio
fetch(soundFile)
	.then((response) => response.arrayBuffer())
	.then((data) => audioContext.decodeAudioData(data))
	.then((buffer) => {
		forwardBuffer = buffer

		reversedBuffer = audioContext.createBuffer(
			buffer.numberOfChannels,
			buffer.length,
			buffer.sampleRate
		)
		for (let i = 0; i < buffer.numberOfChannels; i++) {
			const forwardData = buffer.getChannelData(i)
			const reversedData = reversedBuffer.getChannelData(i)
			for (let j = 0; j < buffer.length; j++) {
				reversedData[j] = forwardData[buffer.length - j - 1]
			}
		}
	})

function playSound(buffer, volume, direction) {
	const source = audioContext.createBufferSource()
	const gainNode = audioContext.createGain()

	source.buffer = buffer
	gainNode.gain.value = volume
	source.connect(gainNode).connect(audioContext.destination)
	source.start()

	// Animate arrow by updating transform
	const arrow = document.getElementById("arrow")
	if (!arrow) return

	if (direction === "forward") {
		arrowX += arrowStep
	} else {
		arrowX -= arrowStep
	}

	arrow.style.transform = `translateX(${arrowX}px)`
}

// Arrow animation loop
function animateArrow() {
	if (scrollDirection === 0) return

	arrowOffsetX += scrollDirection * 2 // adjust speed here
	arrow.style.transform = `translateX(${arrowOffsetX}px)`
	animationFrameId = requestAnimationFrame(animateArrow)
}

function startArrowAnimation(direction) {
	scrollDirection = direction
	if (!animationFrameId) {
		animationFrameId = requestAnimationFrame(animateArrow)
	}
	clearTimeout(scrollTimeoutId)
	scrollTimeoutId = setTimeout(() => stopArrowAnimation(), 200)
}

function stopArrowAnimation() {
	scrollDirection = 0
	cancelAnimationFrame(animationFrameId)
	animationFrameId = null
}

// Only enable scroll-triggered sound after user has clicked
function handleWheel(event) {
	if (!userHasInteracted) return

	const direction = event.deltaY > 0 ? "forward" : "reverse"

	if (direction === "forward") {
		arrowX += arrowStep
		playSound(forwardBuffer, globalVolume, "forward")
	} else if (direction === "reverse") {
		arrowX -= arrowStep
		playSound(reversedBuffer, globalVolume, "reverse")
	}

	const arrow = document.getElementById("arrow")
	if (arrow) {
		arrow.style.transform = `translateX(${arrowX}px)`
	}
}

// Enable after user clicks
function enableScrollSound() {
	if (userHasInteracted) return
	userHasInteracted = true
	audioContext.resume()
	window.addEventListener("wheel", handleWheel, { passive: true })
}

document.addEventListener("click", enableScrollSound)

document.addEventListener("DOMContentLoaded", () => {
	arrow = document.getElementById("arrow")
	document.addEventListener("click", enableScrollSound)
})

let lastWheelTime = 0
const wheelThrottleMs = 150

window.addEventListener("wheel", (event) => {
	if (!userHasInteracted) return

	const now = Date.now()
	if (now - lastWheelTime < wheelThrottleMs) return
	lastWheelTime = now

	const atTop = window.scrollY === 0
	const atBottom =
		window.innerHeight + window.scrollY >= document.body.scrollHeight

	if (atTop && event.deltaY < 0) {
		playSound(reversedBuffer, globalVolume, "reverse") // trigger animation and sound
	} else if (atBottom && event.deltaY > 0) {
		playSound(forwardBuffer, globalVolume, "forward")
	}
})
