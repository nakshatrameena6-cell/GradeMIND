from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import hash_password, create_access_token
from app.utils.roles import Roles


class AuthService:
    """
    Service class handling authentication business logic.
    Currently uses placeholder implementations without database queries.
    """
    
    @staticmethod
    def register_user(user_data: RegisterRequest) -> dict:
        """
        Mock registration logic.
        Generates a hashed password but does not persist to database.
        """
        # Demonstrate password hashing works
        _ = hash_password(user_data.password)
        
        # Return mock user response dictionary
        return {
            "id": 1,
            "name": user_data.name,
            "email": user_data.email,
            "role": Roles.STUDENT
        }

    @staticmethod
    def login_user(login_data: LoginRequest) -> dict:
        """
        Mock login logic.
        Validates structure and returns a signed access token.
        """
        # Determine a mock role based on email to make development easier
        role = Roles.TEACHER
        if "admin" in login_data.email:
            role = Roles.ADMIN
        elif "student" in login_data.email:
            role = Roles.STUDENT
            
        # Create token payload
        payload = {
            "sub": login_data.email,
            "id": 42,
            "role": role,
            "name": "Jane Doe"
        }
        
        access_token = create_access_token(data=payload)
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    @staticmethod
    def get_current_user_by_email(email: str) -> dict:
        """
        Mock method to retrieve user details by email.
        """
        role = Roles.TEACHER
        if "admin" in email:
            role = Roles.ADMIN
        elif "student" in email:
            role = Roles.STUDENT
            
        return {
            "id": 42,
            "name": "Jane Doe",
            "email": email,
            "role": role
        }
