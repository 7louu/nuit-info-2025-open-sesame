import warnings

# Suppress deprecation warnings from third-party libraries
warnings.filterwarnings("ignore", category=UserWarning, module="speechbrain")
warnings.filterwarnings("ignore", category=UserWarning, module="torchaudio")
warnings.filterwarnings("ignore", category=FutureWarning, module="torch")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import register
from app.api.routes import authenticate

app = FastAPI(
    title="Open Sesame API",
    description="Voice Authentication API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


app.include_router(register.router, prefix="/api", tags=["Registration"])
app.include_router(authenticate.router, prefix="/api", tags=["Authentication"])
