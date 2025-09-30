const express = require("express")
const path = require("path")
const app = express()
const port = 3000

// Serve all static files from current directory (project-root)
app.use(express.static(path.join(__dirname)))

// Fallback for unknown routes (optional)
app.use((req, res) => {
	res.status(404).send("Sorry, not found!")
})

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`)
})
