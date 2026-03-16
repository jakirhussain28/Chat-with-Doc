from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Import the modular routers
from routers import config_router, upload_router, chat_router, conv_router

# Initialize FastAPI App
app = FastAPI(title="ChatDOX RAG API")

origins = [
    "https://chatdox.pages.dev",
    "http://localhost:5000",
    "http://localhost:5001"
]

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Register all routes from the routers directory
app.include_router(config_router.router)
app.include_router(upload_router.router)
app.include_router(chat_router.router)
app.include_router(conv_router.router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)