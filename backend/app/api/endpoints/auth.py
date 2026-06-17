from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
async def login(username: str = "admin"):
    # This is a temporary mock login so your React frontend can connect!
    if username == "admin":
        return {"role": "admin", "name": "Admin User", "token": "mock-jwt-admin"}
    return {"role": "staff", "name": "Elena Moretti", "token": "mock-jwt-staff"}
