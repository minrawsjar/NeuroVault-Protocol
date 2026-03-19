require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const pinataSDK = require('@pinata/sdk');

const app = express();
app.use(cors()); 
app.use(express.json()); 

const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET);

app.post('/upload', async (req, res) => {
    try {
        const aiData = req.body.data; 

        if (!aiData) {
            return res.status(400).json({ error: "No AI data sent!" });
        }

        console.log("Processing AI data...");

        const payload = {
            source: "Polkadot Hackathon AI",
            content: aiData
        };

        const result = await pinata.pinJSONToIPFS(payload);
        
        console.log("Success! Data sent to IPFS.");
        console.log("CID:", result.IpfsHash);

        res.json({
            success: true,
            cid: result.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
        });

    } catch (error) {
        console.error("Upload failed:", error);
        res.status(500).json({ error: "Failed to upload to IPFS" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 IPFS Server is running on http://localhost:${PORT}`);
});