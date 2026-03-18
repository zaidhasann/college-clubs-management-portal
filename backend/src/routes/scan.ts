import express, { Request, Response } from "express";

const router = express.Router();

router.post("/scan", async (req: Request, res: Response) => {

    const { qrData } = req.body;

    console.log("QR received:", qrData);

    res.json({
        success: true,
        message: "Attendance marked"
    });

});

export default router;