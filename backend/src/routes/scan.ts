const express = require("express");
const router = express.Router();

router.post("/scan", async (req, res) => {

    const { qrData } = req.body;

    console.log("QR received:", qrData);

    // Example QR data
    // { userId: "123", eventId: "abc" }

    // mark attendance in DB

    res.json({
        success: true,
        message: "Attendance marked"
    });

});

module.exports = router;