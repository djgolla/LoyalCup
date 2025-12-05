from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, users, shops, menu, orders, loyalty, admin

app = FastAPI(title="LoyalCup API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],  # Vite, React dev servers, and all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(shops.router)
app.include_router(menu.router)
app.include_router(orders.router)
app.include_router(loyalty.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"message": "LoyalCup API - Complete Platform"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
