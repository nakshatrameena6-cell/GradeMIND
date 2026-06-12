import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.utils.response import error_response

logger = logging.getLogger("app.middleware.exceptions")


def register_exception_handlers(app: FastAPI) -> None:
    """
    Register global exception handlers on the FastAPI application instance.
    """
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        # Format the validation errors
        errors = exc.errors()
        error_messages = []
        for err in errors:
            loc = " -> ".join(str(l) for l in err.get("loc", []))
            msg = err.get("msg", "Invalid value")
            error_messages.append(f"[{loc}]: {msg}")
        
        detail_msg = "Validation failed: " + "; ".join(error_messages)
        return error_response(
            message=detail_msg,
            status_code=422,
            errors=errors
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return error_response(
            message=exc.detail,
            status_code=exc.status_code
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        # Log the full stack trace for internal server errors
        logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
        return error_response(
            message="Internal server error",
            status_code=500
        )
