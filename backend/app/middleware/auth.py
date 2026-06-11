from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.security import decode_access_token

# OAuth2 scheme definition, pointing to our future login endpoint
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency to extract and validate the JWT token from the Authorization header.
    Returns stub user data matching the UserResponse schema, without database queries.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email: str = payload.get("sub")
    role: str = payload.get("role", "STUDENT")
    name: str = payload.get("name", "Stub User")
    user_id: int = payload.get("id", 1)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing subject",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    return {
        "id": user_id,
        "name": name,
        "email": email,
        "role": role
    }


class JWTAuthMiddleware(BaseHTTPMiddleware):
    """
    Optional middleware to check for Authorization headers and validate JWT structure on requests.
    Stores user payload in request.state.user for downstream access.
    """
    async def dispatch(self, request: Request, call_next):
        # Exclude docs/openapi/health paths from strict checks in middleware if needed,
        # but here we only validate the token if the header is present, allowing standard route dependencies to handle missing auth.
        auth_header = request.headers.get("Authorization")
        if auth_header:
            parts = auth_header.split()
            if len(parts) == 2 and parts[0].lower() == "bearer":
                token = parts[1]
                payload = decode_access_token(token)
                if not payload:
                    return JSONResponse(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        content={
                            "success": False,
                            "message": "Invalid or expired authorization token"
                        }
                    )
                # Store payload in request state
                request.state.user = payload
                
        return await call_next(request)
