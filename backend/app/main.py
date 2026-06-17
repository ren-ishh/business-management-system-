from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

# Import our endpoints
from app.api.endpoints import auth, operations

app = FastAPI(title="Bridal Way API", version="0.1.0")

# Configure CORS (Allows React to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(operations.router, prefix="/api/operations", tags=["operations"])

@app.get("/health")
async def health():
    return {"status": "ok", "service": "bridal-way-api"}