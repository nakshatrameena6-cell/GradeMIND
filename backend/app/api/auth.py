from fastapi import APIRouter, Depends, status
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import AuthService
from app.middleware.auth import get_current_user
from app.utils.response import success_response

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: RegisterRequest):
    """
    Register a new user.
    Uses placeholder registration logic.
    """
    user_info = AuthService.register_user(user_data)
    return success_response(
        data=user_info,
        message="User registered successfully",
        status_code=status.HTTP_201_CREATED
    )


@router.post("/login")
def login(login_data: LoginRequest):
    """
    Authenticate user credentials.
    Uses placeholder validation and token generation.
    """
    token_info = AuthService.login_user(login_data)
    return success_response(
        data=token_info,
        message="Login successful"
    )


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    """
    Retrieve profile details of the currently authenticated user.
    Checks and validates token structure.
    """
    return success_response(
        data=current_user,
        message="Current user details retrieved successfully"
    )
