import serverRuntime from "../server-runtime.cjs";

const { app } = serverRuntime;

export default function handler(req: any, res: any) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Idempotency-Key"
  );
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  try {
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Invocation Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", message: err?.message || "Unknown error" });
    }
  }
}

