fetch('http://localhost:3000/upload', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ 
        data: "Hello from the AI! This is my test data for Polkadot." 
    })
})
.then(response => response.json())
.then(data => console.log("Response from server:", data))
.catch(error => console.error("Error:", error));