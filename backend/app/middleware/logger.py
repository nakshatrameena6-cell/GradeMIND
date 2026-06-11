import time
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("app.middleware.logger")
logger.setLevel(logging.INFO)

# Ensure handlers are set up if not already done by standard logging
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter("[%(levelname)s] %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log request method, path, response status code, and execution duration.
    Example: [INFO] POST /auth/login 200 42ms
    """
    async def dispatch(self, request: Request, call_next) -> Response:
        start_time = time.perf_counter()
        
        response = await call_next(request)
        
        execution_time_ms = (time.perf_counter() - start_time) * 1000
        
        # Log request summary
        logger.info(
            f"{request.method} {request.url.path} {response.status_code} {execution_time_ms:.0f}ms"
        )
        
        return response
