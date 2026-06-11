from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.core.database import init_db
from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.middleware.logger import LoggingMiddleware
from app.middleware.auth import JWTAuthMiddleware
from app.middleware.exceptions import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize the database tables
    try:
        init_db()
    except Exception as e:
        # Log error or print in debug
        print(f"Database initialization failed during startup: {e}")
    yield
    # Shutdown: Clean up if needed
    pass


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="GradeMIND Backend Foundation - AI-powered answer sheet evaluation platform.",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Register custom middlewares
# Note: Middlewares are executed in reverse order of registration for HTTP requests.
app.add_middleware(JWTAuthMiddleware)
app.add_middleware(LoggingMiddleware)

# Register custom error / validation exception handlers
register_exception_handlers(app)

# Register routers
app.include_router(health_router)
app.include_router(auth_router)
