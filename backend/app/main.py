from fastapi import FastAPI
from routes import auth, orders

app = FastAPI()

app.include_router(auth.router)
app.include_router(orders.router)
