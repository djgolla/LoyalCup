from fastapi import FastAPI
from routes import auth, loyalty

app = FastAPI()

app.include_router(auth.router)
app.include_router(loyalty.router)
