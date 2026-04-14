import express from "express";
const app = express();
app.get("/api/test", (req, res) => res.json({ ok: true }));
export default app;
