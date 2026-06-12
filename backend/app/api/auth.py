from fastapi import APIRouter, Depends, status, Request
from app.schemas.auth import RegisterRequest, LoginRequest, RefreshTokenRequest
from app.services.auth_service import AuthService
from app.api.auth_deps import get_current_user, get_auth_service
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    request: Request,
    user_data: RegisterRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Register a new user.
    """
    ip_address = request.client.host if request.client else None
    user_info = auth_service.register_user(user_data, ip_address=ip_address)
    return success_response(
        data=user_info,
        message="User registered successfully",
        status_code=status.HTTP_201_CREATED
    )


@router.post("/login")
def login(
    request: Request,
    login_data: LoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Authenticate user credentials and generate tokens.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    token_info = auth_service.login_user(login_data, ip_address=ip_address, user_agent=user_agent)
    return success_response(
        data=token_info,
        message="Login successful"
    )

@router.post("/refresh")
def refresh_token(
    request: Request,
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Exchange a valid refresh token for a new access token.
    """
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    token_info = auth_service.refresh_access_token(refresh_data.refresh_token, ip_address=ip_address, user_agent=user_agent)
    return success_response(
        data=token_info,
        message="Token refreshed successfully"
    )

@router.post("/logout")
def logout(
    request: Request,
    refresh_data: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
    current_user: dict = Depends(get_current_user)
):
    """
    Log out a user by revoking their refresh token.
    """
    ip_address = request.client.host if request.client else None
    auth_service.logout_user(refresh_data.refresh_token, ip_address=ip_address)
    return success_response(
        message="Logged out successfully"
    )


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Retrieve profile details of the currently authenticated user.
    """
    return success_response(
        data=current_user,
        message="Current user details retrieved successfully"
    )
